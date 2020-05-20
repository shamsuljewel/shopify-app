require('isomorphic-fetch');
const axios = require('axios');
var bodyParser = require('koa-bodyparser');
const express = require('express');
const path = require('path');
const serveStatic = require('serve-static');
const dbHandler = require("./server/dbHandler");
var Cookies = require('cookies')
const Koa = require('koa');
const send = require('koa-send');
const cors = require('@koa/cors');
const next = require('next');
const {default: createShopifyAuth} = require('@shopify/koa-shopify-auth');
const dotenv = require('dotenv');
const {verifyRequest} = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const {ApiVersion} = require('@shopify/koa-shopify-graphql-proxy');
const Router = require('koa-router');
const ShopifyToken = require('shopify-token');
dotenv.config();
const {receiveWebhook, registerWebhook} = require('@shopify/koa-shopify-webhooks');
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();
var koaBody = require('koa-body');
var shopifyAPI = require('shopify-node-api');
let Token
const {
    SHOPIFY_API_SECRET_KEY,
    SHOPIFY_API_KEY,
    HOST
} = process.env;

app.prepare().then(() => {
    const server = new Koa();
    const router = new Router();
    server.use(session({sameSite: 'none', secure: true}, server));
    server.keys = [SHOPIFY_API_SECRET_KEY];

    server.use(
        createShopifyAuth({
            apiKey: SHOPIFY_API_KEY,
            secret: SHOPIFY_API_SECRET_KEY,
            scopes: ['read_products', 'write_products', 'write_shipping', 'read_orders', 'write_orders', 'write_script_tags'],
            async afterAuth(ctx) {
                const {shop, accessToken} = ctx.session;
                Token = accessToken
                var Shopify = new shopifyAPI({
                    shop: shop,
                    shopify_api_key: SHOPIFY_API_KEY,
                    shopify_shared_secret: SHOPIFY_API_SECRET_KEY,
                    access_token: accessToken,
                });
                let post_data = {
                    "carrier_service":
                        {
                            "name": "Doorhub - Sameday Shipping",
                            "callback_url": `${HOST}/webhook/dh-validate`,
                            "carrier_service_type": 'api',
                            "service_discovery": true
                        }
                }

                Shopify.post('/admin/api/2020-04/carrier_services.json', post_data, function (err, data, headers) {
                    console.log('Carrier Registered', data);
                })

                post_data = {
                    "script_tag":
                        {
                            "event": "onload",
                            "src": `${HOST}/public/thankyou-script`,
                            "display_scope": "order_status"
                        }
                }
                //Inject Script tag
                Shopify.post('/admin/api/2020-04/script_tags.json', post_data, function (err, data, headers) {
                    console.log('script registered', data);
                })

                ctx.cookies.set("shopOrigin", shop, {
                    httpOnly: false,
                    secure: true,
                    sameSite: 'none'
                });


                const registration = await registerWebhook({
                    address: `${HOST}/webhooks/orders/create`,
                    topic: 'ORDERS_CREATE',
                    accessToken,
                    shop,
                    apiVersion: ApiVersion.April20
                });
                if (registration.success) {
                    console.log('Successfully registered webhook!');
                } else {
                    console.log('Failed to register webhook', registration.result.data.webhookSubscriptionCreate);
                    console.log('Failed ', registration.result.data.webhookSubscriptionCreate.field);
                }

                const on_payment = await registerWebhook({
                    address: `${HOST}/webhooks/orders/paid`,
                    topic: "ORDERS_PAID",
                    accessToken,
                    shop,
                    apiVersion: ApiVersion.April20
                });
                if (on_payment.success) {
                    console.log('Successfully registered webhook!');
                } else {
                    console.log('Failed to register webhook', on_payment.result.errors);
                }


                const shopRequestUrl = 'https://' + shop + '/admin/apps';
                console.log('ctx is here', ctx.request.url)
                ctx.redirect(shopRequestUrl);
            }
        })
    );

    async function createOrder(ctx) {
        let orderData = ctx.request.body
        let WholeAddress = `${orderData.shipping_address.address1},${orderData.shipping_address.city}, ${orderData.shipping_address.country}`
        let data = await dbHandler.getSettings({apiKey: SHOPIFY_API_KEY});
        let dbConfig = data[0];
        const config = {headers: {Authorization: `Bearer ${dbConfig.api_key}`}};

        let Final = {
            dropOffAddress: WholeAddress,
            customerName: `${orderData.shipping_address.first_name} ${orderData.shipping_address.last_name}`,
            customerPhone: orderData.phone || 'no-0000000',
            productSize: 'medium',
            customerFloor: 11,
            companyId: 1,
            warehouseId: dbConfig.warehouse_id,
            description: orderData.name,
            // deliveryId: testdata.line_items[0].id,
            deliveryId: orderData.id,
            dateForDropOff: '2021-03-21',
            distributionId: 2,
            // regionId: 1,
            deliveryType: 1
        }

        if ((dbConfig.payment_time == 0 && ctx.originalUrl == '/webhooks/orders/create') ||
            (dbConfig.payment_time == 1 && ctx.originalUrl == '/webhooks/orders/paid')) {
            axios.post('https://doorhub.io/api/sameday/v1/warehouse/order/checkout', Final, config).then(result => {
                let storeRef = dbHandler.StoreRef({
                    doorhub_ref_id: result.data.data.orderRef,
                    settings_id: dbConfig.payment_time,
                    shopify_order_id: orderData.id
                });
            }).catch(error => {
                console.log('error here', error, config)
            })
        }

        ctx.status = 201;
    }

    server.use(bodyParser());
    server.use(router.allowedMethods());
    server.use(router.routes());

    router.get('/public/thankyou-script', cors(), async (ctx, next) => {
        await send(ctx, 'public/js/thankyou-page.js');
    });

    router.get('/public/order/:orderId', cors(), async (ctx, next) => {
        let getOrderTable = await dbHandler.getOrderDetailByOrderId(ctx.params.orderId);

        // ctx.response.body = false;
        if (getOrderTable.length > 0) {
            let dbSettings = await dbHandler.getSettings({apiKey: SHOPIFY_API_KEY})
            if (dbSettings) {
                let config = {headers: {Authorization: `Bearer ${dbSettings[0].api_key}`}};
                let doorhub_result = await axios.get(`https://doorhub.io/api/sameday/v1/warehouse/order/176-0032/show`, config)
                ctx.response.body = JSON.stringify(doorhub_result.data.data);
            }
        } else {
            ctx.response.body = false;
        }
        ctx.status = 200;
    });

    router.get('/orders', async (ctx, next) => {
        let data = ctx.request.query;
        if (typeof data.id !== "undefined") {
            let response = await fetch(`https://${data.shop}/admin/api/2020-04/orders/${data.id}.json`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    "X-Shopify-Access-Token": ctx.session.accessToken
                },
            })
            let spOrder = await response.json()
            let dbSettings = await dbHandler.getSettings({apiKey: SHOPIFY_API_KEY})
            const config = {headers: {Authorization: `Bearer ${dbSettings[0].api_key}`}};
            let getOrderTable = await dbHandler.getOrderDetailByOrderId(spOrder.order.id);
            var sendData = {
                dhOrder: false,
                dbSettings: dbSettings[0],
                spOrder: spOrder
            };
            if (getOrderTable.length > 0) {
                let doorhub_result = await axios.get(`https://doorhub.io/api/sameday/v1/warehouse/order/${getOrderTable[0].doorhub_ref_id}/show`, config)
                sendData.dhOrder = doorhub_result.data;
            } else {
                sendData.dhOrder = false
            }
        } else {
            sendData = false
        }
        ctx.req.orderData = sendData;
        await next()

    });

    router.get('/api/configure', async (ctx, next) => {
        let response = typeof ctx.request.query.shop !== "undefined" ? JSON.parse(ctx.request.query.shop) : {}
        const check = await dbHandler.getSettings(response)
        ctx.body = check
    })

    router.post('/order/post', async ctx => {
        const check = await dbHandler.getSettings({apiKey: SHOPIFY_API_KEY})
        const StoreData = await dbHandler.StoreRef({
                ...ctx.request.body.data,
                settings_id: check[0].payment_time
            }
        )

    })

    router.post('/api/configure', async (ctx) => {
        var values = [
            [ctx.request.body.api, ctx.request.body.payTime, ctx.request.body.warehouse, ctx.request.body.access_token]
        ];
        let resultData = await dbHandler.addSetting(values[0])
        ctx.response.body = ctx.request.body
    });

    router.post('/api/configure/update', async (ctx) => {
        var values = [
            [ctx.request.body.api, ctx.request.body.payTime, ctx.request.body.warehouse, ctx.request.body.access_token]
        ];
        let editData = await dbHandler.update(values[0])
        ctx.response.body = 'done'
    })

    const webhook = receiveWebhook({secret: SHOPIFY_API_SECRET_KEY});

    //Capture Before Payment or After Payment Webhooks
    router.post('/webhooks/orders/create', webhook, createOrder);
    router.post('/webhooks/orders/paid', webhook, createOrder);

    router.post('/webhook/dh-validate', async function (ctx) {
        let AllData = ctx.request.body
        let WholeAddress = `${AllData.rate.destination.address1} ${AllData.rate.destination.city}, ${AllData.rate.destination.country} `
        let dbSettings = await dbHandler.getSettings({apiKey: SHOPIFY_API_KEY})
        const config = {headers: {Authorization: `Bearer ${dbSettings[0].api_key}`}};
        const bodyParameters = {
            dropOffAddress: WholeAddress
        };

        let data = await axios.post('https://doorhub.io/api/sameday/v1/warehouse/customer/address/check',
            bodyParameters,
            config);

        ctx.response.body = {
            "rates": {
                "service_name": "Doorhub - Sameday Shipping",
                "description": data.data.message,
                "service_code": Math.random().toString(36).substr(2, 9),
                // "currency": data.data.data.priceUnit,
                "currency": 'EUR',
                "total_price": data.data.data.price * 100
            }
        }
    });

    router.get('*', verifyRequest(), async (ctx) => {
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
    });

    server.listen(port, () => {
        console.log(`> Ready on ${HOST}`);
    });
});