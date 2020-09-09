# Doorhub - Shopify

This is custom project that should reside on Doorhub's node enabled server.

We are using Combination of following major technologies:
* NodeJS
* Express
* KOA
* NextJS
* ReactJS
* MySQL
* axios

## Configuring the App

The configuration process of this project is pretty simple but there are couple of steps involved those needs to be followed carefully in order to run the complete flow.

### Create Shopify Public app
1. Create A new Public App on Shopify Partner account
    1. Create A partner account: https://partners.shopify.com
    2. Create New App by going into Partner Dashboard > App > All Apps > Create App
    3. Select `Public App` as an option
    4. Give app name here for public to see
    5. In App URL provide the public accessible URL of this node project example: `https://where-this-app-is-accessible.com`
    6. Please whitelisted redirection URL: `https://where-this-app-is-accessible.com/auth/callback`
    7. Click on Create App now.
2. Once app is created, you can further configure this app for better public presentation. By giving graphics and other details in App Setup.
3. Lastly create an external link inside your app: 
    1. Goto `Apps > All apps > [App Name] > Extensions`
    2. Under `Admin Links` Click on button `Add a link`
    3. In this form provide Link Label as `Doorhub`
    4. For link target use `https://where-this-app-is-accessible.com/orders`
    5. From dropdown `Page to show link` select `Order details`
4. The shopify app setup is complete here

### Create Database
We are using MySQL database to store app's record back to the system. So create a MySQL database at this point.

The database structure is very simple and you will be required to create only 2 very basic tables using following SQL script inside your db server

```
create table orders
(
    id               int auto_increment
        primary key,
    shopify_order_id varchar(255) null,
    doorhub_ref_id   varchar(255) null,
    settings_id      int          null
);

create table settings
(
    id             int auto_increment
        primary key,
    api_key        varchar(255)       null,
    payment_time   int                null,
    warehouse_id   varchar(100)       null,
    access_token   varchar(255)       null,
    use_dh_cost    tinyint default 1  not null,
    ship_cost      int     default 50 null,
    free_ship      tinyint default 0  not null,
    free_threshold int     default 50 not null
);
```

### Configure Node app on server
1. Download this package to a node enabled machine
2. Run `npm install` to get all dependencies cleared
3. Now get the config .env file using example code given below.
4. In .env file get `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET_KEY` from your public app created on Shopify
5. Also provide database details in this .env file that you've used above.
6. At this point, we just need one last change in code, that can be done in file `public/js/thankyou-page.js`
7. On line # 2 of this file replace the `appUrl` value to your current apps URL
```
SHOPIFY_API_KEY='a***********'
SHOPIFY_API_SECRET_KEY='shpss_*************'
HOST='https://where-this-app-is-accessible.com'
DB_CONNECTION='mysql'
DB_HOST='localhost'
DB_PORT='3306'
DB_DATABASE='db-name'
DB_USERNAME='db-user'
DB_PASSWORD='db-pass'
```

## Run Application
As a node project, you got couple of options to host this app on modern stack and based on your chosen stack, the steps to run this can be very different.

For the configurations and testing, we are going to explain one of the techniques. That involves:

1. You can run the command `npm run dev` on root of this application install
2. This will immediately give you the URL with local host access and port `3000`
3. You can use the connection to this app using your server IP or resolve a domain on top of it
4. If possible, we recommend using `http reverse proxy`
    1. For running the reverse proxy, use Nginx or Apache
    2. Create a virtual host file and resolve a domain
    3. In the property, simply connection back your web server to node express local url with port 3000
    4. This technique will keep your app layer behind the Web server layer for better control
    
The app is configured at this point and you should able to see everything running on test stores. You can test the app by loading it on accessible URL.


## Installing on Shopify
1. Once everything is configured and ready to run. You can go back to your partner dashboard and create a test store with configurations. `Stores > Add Store > Development Store`
2. After creating a store go back to your app `Apps > All apps > [App Name] > select store`
3. Target this newly created store and complete the installation process