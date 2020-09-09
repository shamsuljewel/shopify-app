const mysql = require("promise-mysql");
const dotenv = require('dotenv');
dotenv.config();
const {
    SHOPIFY_API_SECRET_KEY,
    SHOPIFY_API_KEY,
    HOST,
    DB_HOST,
    DB_PORT,
    DB_DATABASE,
    DB_USERNAME,
    DB_PASSWORD,
} = process.env;

async function query(sql) {
    const connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE
    });
    try {
        const result = connection.query(sql);
        connection.end();
        return result;
    } catch (error) {
        throw error;
    }
}

async function getSettings(response) {
    let result
    if (Object.entries(response).length == 0) {
        result = await query(`SELECT * FROM settings`);
    } else {
        result = await query(`SELECT * FROM settings WHERE  access_token = ${JSON.stringify(response.apiKey)}`);
    }
    if (result) {
        return result;
    }
    return null;
}

async function StoreRef(data) {
    const check = await query("INSERT INTO orders (doorhub_ref_id,settings_id,shopify_order_id) VALUES" + " ('" + data.doorhub_ref_id + "', '" + data.settings_id + "', '" + data.shopify_order_id + "');"
    )
    if (check) {
        console.log('added', check)
    } else {
        console.log('error')
    }
}

async function addSetting(data) {
    var table = 'settings'
    const check = await query(
        "INSERT INTO " + table + " (api_key,payment_time,warehouse_id,access_token,use_dh_cost,ship_cost,free_ship,free_threshold) VALUES" +
        " ('" + data[0] + "', '" + data[1] + "', '" + data[2] + "', '" + data[3] + "', '" + data[4] + "', '" + data[5] + "', '" + data[6] + "', '" + data[7] + "' );"
    )
    if (check) {
        console.log('added', check)
    } else {
        console.log('error')
    }
}


async function update(data) {
    let temp = `UPDATE settings SET  api_key=${JSON.stringify(data[0])} , payment_time=${data[1]} , warehouse_id=${data[2]}, use_dh_cost=${data[4]}, ship_cost=${data[5]}, free_ship=${data[6]}, free_threshold=${data[7]} WHERE access_token=${JSON.stringify(data[3])} `
    console.log(temp)
    const check = await query(
        temp
    )
    if (check) {
        console.log('records changed')
    } else {
        console.log('errors')
    }
}

async function getOrderDetailByOrderId(data) {
    let temp = `SELECT * FROM orders WHERE  shopify_order_id = ${data}`
    const check = await query(
        temp
    )
    if (check) {
        return check
    } else {
        console.log('error here')
    }
}

async function getMultipleOrders(data) {
    let orderIds = data.join(',');
    let temp = `SELECT * FROM orders WHERE shopify_order_id IN (${orderIds})`
    const check = await query(
        temp
    )
    if (check) {
        return check
    } else {
        console.log('error here')
    }
}

async function deleteMultipleOrders(data) {
    let orderIds = data.join(',');
    let temp = `DELETE FROM orders WHERE shopify_order_id IN (${orderIds})`
    const check = await query(
        temp
    )
    if (check) {
        return check
    } else {
        console.log('error here')
    }
}

async function deleteShop(data) {
    let shopData = this.getSettings(data);

    let temp = `DELETE FROM orders WHERE settings_id = ${shopData[0].settings_id}`
    const check = await query(
        temp
    )

    temp = `DELETE FROM settings WHERE id = ${shopData[0].id}`
    const shopDel = await query(
        temp
    )


    if (shopData) {
        return shopData
    } else {
        console.log('error here')
    }
}


module.exports = {
    getSettings,
    update,
    addSetting,
    StoreRef,
    getOrderDetailByOrderId,
    getMultipleOrders
};
