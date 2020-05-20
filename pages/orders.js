import {useRouter} from 'next/router'
import React, {useEffect,useState} from 'react';
import {Card, Stack, FormLayout, TextField, Button, Checkbox, Heading, Select, Page,DescriptionList} from '@shopify/polaris';
import axios from "axios";

const Orders = (props) => {
    const {pageProps, orderData} = props;
    const router = useRouter();
    const [disable,setDisable]=useState(false)
    const [dh,setdh]=useState(orderData.dhOrder)
    const config = {apiKey: API_KEY, forceRedirect: true};
    const {id, shop} = router.query;
    const {dhOrder, dbSettings, spOrder} = orderData;
    const sendData = () => {
        setDisable(true)
        let WholeAddress = `${spOrder.order.shipping_address.address1},${spOrder.order.shipping_address.city}, ${spOrder.order.shipping_address.country}`
        let data = {
            dropOffAddress: WholeAddress,
            customerName: `${spOrder.order.shipping_address.first_name} ${spOrder.order.shipping_address.last_name}`,
            customerPhone: '123123213',
            // spOrder.order.shipping_address.phone,
            productSize: typeof spOrder.order.line_items[0].variant_title=="undefined"||spOrder.order.line_items[0].variant_title==null?'medium':spOrder.order.line_items[0].variant_title,
            customerFloor: 11,
            companyId: 1,
            warehouseId: dbSettings.warehouse_id,
            deliveryId: 234234235,
            dateForDropOff: '2022-03-21',
            distributionId: 2,
            deliveryType: 1
        }
        axios.post('https://doorhub.io/api/sameday/v1/warehouse/order/checkout', data, {
            headers: {
                Authorization: `Bearer ${dbSettings.api_key}`
            }
        }).then(result => {
            console.log('here is result',result)
            let data={
                    doorhub_ref_id: result.data.data.orderRef,
                    shopify_order_id: spOrder.order.id
            }
            axios.post('/order/post',{data}).then(response=>{
                console.log(response)
            })
            setdh(result.data)
        }).catch(error => {
            console.log('error', error)
        })
    }
    console.log('dh here bowwwwwww',dh)
        return (
            <Page
                breadcrumbs={[{content: 'Orders', url: `https://${shop}/admin/orders/${id}`}]}
                title={'Doorhub Payment'}
            >
                <Card sectioned title="Doorhub Order">
                    {dh&&<DescriptionList
                        items={[

                            {
                                term: 'Customer Name',
                                description:dh.data.order.customerName,
                            },
                            {
                                term: 'Customer Phone',
                                description: dh.data.order.customerPhone,
                            },
                            {
                                term: 'Pickup Address',
                                description:dh.data.order.pickupAddress
                            },
                            {
                                term: 'DropOff Address',
                                description:dh.data.order.dropOffAddress
                            },
                            {
                                term: 'Product Size',
                                description:dh.data.order.productSize
                            },
                            {
                                term: 'Delivery Time',
                                description:dh.data.order.deliveryTime
                            },{
                                term: 'Date For DropOff',
                                description:dh.data.order.dateForDropOff
                            },
                        ]}
                    />}
                    {orderData!==false&&!dh && <Stack alignment="center">
                        <p>Please Click this button to place the  Order to doorhub</p>
                        <br/>
                        <Button disabled={disable} primary onClick={sendData}>Create Doorhub Request</Button>
                    </Stack>}

                    {orderData==false&&<Stack alignment="center">
                        <p>There is no order detail present  </p>
                        </Stack>
                    }
                </Card>

            </Page>
        );
}

export default Orders;