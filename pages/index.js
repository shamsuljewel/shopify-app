import React, {useState, useEffect, useCallback} from 'react';
import {FormLayout, TextField, Button, Checkbox, Heading, Select, Page, RadioButton, Banner} from '@shopify/polaris';
import axios from 'axios'

const Register = (props) => {
    const [api_Key, setApi_Key] = useState('');
    const [company_Address, setCompanyAddress] = useState('');
    const [w_houseId, setW_houseId] = useState('');
    const [category, setCategory] = useState(0);
    const [dhCost, setDhCost] = useState(1);
    const [shippingCost, setShippingCost] = useState('50');
    // const [freeShip, setFreeShip] = useState('dhFreeDsiabled');
    const [freeShip, setFreeShip] = useState(0);
    const [freeThreshold, setFreeThreshold] = useState('50');
    const [update, setUpdate] = useState(true);
    const [submit, setSubmit] = useState(true);
    const [formSuccess, setFormSuccess] = useState(false);
    // const [category, setCategory] = useState(0);
    useEffect(() => {
        axios.get('/api/configure', {
            params: {
                shop: props.shop
            }
        }).then(response => {
            if (response.data.length == 0) {
                setUpdate(false)
            } else {
                let Data = response.data[0]
                console.log('data here', Data);
                setApi_Key(Data.api_key)
                setW_houseId(Data.warehouse_id)
                setCategory(Data.payment_time)
                setDhCost(Data.use_dh_cost)
                setShippingCost(Data.ship_cost.toString())
                setFreeShip(Data.free_ship)
                setFreeThreshold(Data.free_threshold.toString())
            }
        })
    }, [props.counter])


    const options = [
        {label: 'Before Payment', value: 0},
        {label: 'After Payment', value: 1},
        {label: 'Manual', value: 2}];
    let handleSubmit = (e) => {
        e.preventDefault();
        let data = {
            api: api_Key,
            payTime: category,
            warehouse: w_houseId,
            access_token: props.shop.apiKey,
            use_dh_cost: dhCost,
            ship_cost: shippingCost,
            free_ship: freeShip,
            free_threshold: freeThreshold,
        }
        if (update) {
            axios.post('/api/configure/update', data).then(response => {
                showSuccess();

                // console.log('response is update here', response)
            })
        } else {
            axios.post('/api/configure', data).then(response => {
                // console.log('response is here', response)
                showSuccess();
            })
        }
    }

    const showSuccess = () => {
        setFormSuccess(true);
        setTimeout(function() {
            setFormSuccess(false);
        }, 8000);
    }

    const handleDropDown = useCallback(value => setCategory(value), []);
    const dhCostChange = useCallback(value => setDhCost(value), []);
    const dhShippingCostChange = useCallback(value => setShippingCost(value), []);
    const dhFreeShipChange = useCallback(value => setFreeShip(value), []);
    const dhSetFreeThreshold = useCallback(value => setFreeThreshold(value), []);

    return (

            <table>
                <tr>
                    <td style={{width: '50%', padding: '15px'}}>
                        <div>
                            {formSuccess && <Banner onDismiss={() => {}} status="success">
                                <p>Your settings are now successfully updated</p>
                            </Banner>}
                            <br />
                            <Heading>Warehouse Setting </Heading>

                            <br/>
                        </div>
                        <FormLayout>
                            <TextField label="Api Key" name='company_Name' value={api_Key} onChange={e => setApi_Key(e)}/>
                            <Select options={options} onChange={handleDropDown} value={category} label="Make Api Call At"/>
                            <TextField type="text" name='Warehouse Id' value={w_houseId} label="Warehouse Id"
                                       onChange={(e) => setW_houseId(e)}/>
                            {/*<RadioButton*/}
                            {/*    label="Use Doorhub Delivery Cost"*/}
                            {/*    helpText="The shipping prices will be loaded automatically via DoorHub."*/}
                            {/*    checked={dhCost === 'dhcEnabled'}*/}
                            {/*    id="dhcEnabled"*/}
                            {/*    name="dh-cost"*/}
                            {/*    onChange={dhCostChange}*/}
                            {/*/>*/}
                            {/*<RadioButton*/}
                            {/*    label="Use Custom Shipping Prices"*/}
                            {/*    helpText="System will use shipping cost mentioned in below field."*/}
                            {/*    checked={dhCost === "dhcDisabled"}*/}
                            {/*    id="dhcDisabled"*/}
                            {/*    name="dh-cost"*/}
                            {/*    onChange={dhCostChange}*/}
                            {/*/>*/}
                            <Checkbox
                                label="Use Doorhub Delivery Cost"
                                helpText="Use Doorhub Delivery CostLoad Shipping cost from Doorhub. Unchecking this box will activate delivery cost box below"
                                checked={dhCost}
                                onChange={dhCostChange}
                            />
                            <TextField
                                label="Shipping Cost"
                                type="number"
                                value={shippingCost}
                                onChange={dhShippingCostChange}
                                // onChange={(newValue) => setShippingCost(newValue)}
                            />

                            {/*<RadioButton*/}
                            {/*    label="No Free Shipping"*/}
                            {/*    helpText="Check this box if you don't want to ship for free"*/}
                            {/*    checked={freeShip === 'dhFreeDsiabled'}*/}
                            {/*    id="dhFreeDsiabled"*/}
                            {/*    name="dh-free-ship"*/}
                            {/*    onChange={dhFreeShipChange}*/}
                            {/*/>*/}
                            {/*<RadioButton*/}
                            {/*    label="Free Shipping"*/}
                            {/*    helpText="Enabling this will allow you to set free Shipping for Doorhub. You can use field below to set minimum threshold"*/}
                            {/*    checked={freeShip === 'dhFreeEnabled'}*/}
                            {/*    id="dhFreeEnabled"*/}
                            {/*    name="dh-free-ship"*/}
                            {/*    onChange={dhFreeShipChange}*/}
                            {/*/>*/}

                            <Checkbox
                                label="Free Delivery "
                                helpText="Free Delivery Check this box for free delivery. It will get order amount to activate free delivery"
                                checked={freeShip}
                                onChange={dhFreeShipChange}
                            />
                            <TextField
                                label="Minimum Order for Free Shipping"
                                type="number"
                                value={freeThreshold}
                                onChange={dhSetFreeThreshold}
                                // onChange={(newValue) => setFreeThreshold(newValue)}
                            />

                            <Button primary onClick={handleSubmit}>Save Changes</Button>
                            <br />
                            {formSuccess && <Banner onDismiss={() => {}} status="success">
                                <p>Your settings are now successfully updated</p>
                            </Banner>}
                            <br/>
                            <br/>
                        </FormLayout>
                    </td>
                    <td style={{paddingLeft: '30px', paddingRight: '30px', marginTop: '0'}}>

                        <Heading>App setup instructions:</Heading>
                        <br/>
                        <br/>
                        <Banner>
                            <Heading>How does it works for you?</Heading>
                            <br/>
                            <br/>
                                    <p><Heading>Required settings</Heading></p>
                                    <li>Contact Doorhub (https:doorhub.io/contact) to make an agreement and setup your account</li>
                                    <li>On the setting page put the api key and warehouse id. The api key and your warehouse id should be provided by Doorhub</li>
                                        <br/>
                                        <Heading>Optional settings</Heading>
                                        <br/>
                                        <p><b>Make Api Call At:</b>
                                        <li>Before payment: If Doorhub will get the order request before you received the payment.</li>
                                        <li>After payment: If Doorhub will get the order request after you received the payment.</li>
                                        <li>Manual: if you manually send the order request to Doorhub.</li>
                                        </p>
                                        <br/>
                                    <p><b>Price settings</b></p>
                                    <li>

                                        Use Doorhub Delivery Cost: if this is checked, customer will see the delivery cost as Doorhub delivery cost,
                                        but if you want to overwrite with your delivery cost,
                                        you have to uncheck this and put your own cost into Shipping Cost.
                                    </li>
                                    <li>Free Delivery: if you want to give free delivery,
                                        you also have to uncheck the doorhub delivery and check free delivery and
                                        choose a value for minimum orders. If order price go over that minimum price,
                                        customer will get the free delivery.</li>

                            <br/>
                            <br/>

                        </Banner>

                    </td>
                </tr>
            </table>

    );
};

export default Register;


