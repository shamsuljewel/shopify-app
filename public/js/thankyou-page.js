//Check if we have Shopify Checkout Object Available
var appUrl = "http://doorhub-shopify.test";
if(Shopify.shop != 'doorhub-test.myshopify.com') {
    appUrl = 'http://doorhub-shopify.test';
}

if (typeof Shopify !== 'undefined' && typeof Shopify.checkout !== 'undefined') {
    let orderId = Shopify.checkout.order_id;

    //If this is Doorhub Shipping
    if(Shopify.checkout.shipping_rate.title == 'Doorhub - Sameday Shipping') {
        // if (Shopify.checkout.shipping_rate.title == 'Standard') {

        //Get Doorhub Box for the end user
        Shopify.Checkout.OrderStatus.addContentBox(
            '<h2>Doorhub Shipping</h2>',
            '<div id="dh-status">Loading Doorhub Details...</div>'
        );

        remoteRequet();
        
        let tries = 0;
        function remoteRequet() {
            let xhr = new XMLHttpRequest();

            xhr.open('GET', `${appUrl}/public/order/${orderId}`);

            xhr.responseType = 'json';

            xhr.send();

            xhr.onload = function () {

                //If we have successful response
                if (typeof xhr.response.orderRef !== 'undefined') {
                    let orderData = xhr.response;

                    console.log(orderData);
                    //Order Details for rendering
                    let htmlStr = '<div class="section__content"><div class="text-container">' +
                        '<div class="section__content__column section__content__column--half">' +
                        '<h3 class="heading-3">Service Name</h3>' +
                        '<p>' + orderData.serviceName + '</p>' +
                        '<h3 class="heading-3">Order Ref</h3>' +
                        '<p>' + orderData.orderRef + '</p>' +
                        '</div><div class="section__content__column section__content__column--half">' +
                        '<h3 class="heading-3">Dropoff Time</h3>' +
                        '<p>' + orderData.order.deliveryTime + '</p>' +
                        '<h3 class="heading-3">Status</h3>' +
                        '<p>' + orderData.order.status + '</p>' +
                        '</div></div></div>';

                    var element = document.getElementById("dh-status");
                    element.innerHTML = htmlStr;
                } else {
                    tries++;

                    //Keep trying to aquire order info for at least 10 seconds
                    if(tries < 5) {
                        setTimeout(function() {
                            remoteRequet();
                        }, 3000)
                    }
                }
            };
        }


    }

}