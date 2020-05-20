import App from 'next/app';
import Head from 'next/head';
import React, {useState, useEffect} from 'react';
import {AppProvider} from '@shopify/polaris';
import {Provider} from '@shopify/app-bridge-react';
import Cookies from "js-cookie";
import '@shopify/polaris/styles.css';
import translations from '@shopify/polaris/locales/en.json';
import ApolloClient from 'apollo-boost';
import {ApolloProvider} from 'react-apollo';
import WareHouseForm from './index.js'

const client = new ApolloClient({
    fetchOptions: {
        credentials: 'include',
    },
});

class MyApp extends App {
    static async getInitialProps({ctx}) {
        let orderData = ctx.req.orderData;
        // console.log(orderData);
        return { orderData };
    }
    render() {
        const {Component, pageProps, router, orderData} = this.props;
        const config = {apiKey: API_KEY, shopOrigin: Cookies.get("shopOrigin"), forceRedirect: true};
        return (
            <React.Fragment>
                <Head>
                    <title>Sample App</title>
                    <meta charSet="utf-8"/>
                </Head>
                <Provider config={config}>
                    <AppProvider i18n={translations}>
                        <ApolloProvider client={client}>
                            <Component {...pageProps} shop={config} orderData={orderData}/>
                            {/*<WareHouseForm shop={config}/>*/}
                        </ApolloProvider>
                    </AppProvider>
                </Provider>
            </React.Fragment>
        );
    }
}

export default MyApp;