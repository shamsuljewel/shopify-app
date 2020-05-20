import React,{useState,useEffect,useCallback} from 'react';
import { FormLayout, TextField, Button,Checkbox,Heading ,Select,Page} from '@shopify/polaris';
import axios from 'axios'
const Register = (props) => {
  const [api_Key, setApi_Key] = useState('');
  const [company_Address, setCompanyAddress] = useState('');
  const [w_houseId, setW_houseId] = useState('');
  const [category, setCategory] = useState(0);
  const [update, setUpdate] = useState(true);
  const [submit, setSubmit] = useState(true);
  // const [category, setCategory] = useState(0);
  useEffect(() => {
    console.log('props here',props)
    axios.get('/api/configure',{ params: {
        shop:props.shop
      }}).then(response=>{
      console.log('checking up',response)
      if(response.data.length==0){
        setUpdate(false)
      }else{
        let Data=response.data[0]
        setApi_Key(Data.api_key)
        setW_houseId(Data.warehouse_id)
        setCategory(Data.payment_time)
        console.log('here is the response of data',response)
      }
    })
  }, [props.counter])


  const options = [
    { label: 'Before Payment', value: 0 },
    { label: 'After Payment', value: 1},
    { label: 'Manual', value: 2 }];
  let handleSubmit=(e)=> {
    e.preventDefault();
    let data = {
      api:api_Key ,
      payTime: category,
      warehouse: w_houseId,
      access_token:props.shop.apiKey
    }
    if(update){
      axios.post('/api/configure/update',data).then(response=>{
        console.log('response is update here',response)
      })
    }else{
      axios.post('/api/configure',data).then(response=>{
        console.log('response is here',response)
      })
    }
  }

  const handleDropDown = useCallback(value => setCategory(value), []);
  return (
      <Page>
        <div>
          <div>
            <Heading>Warehouse Setting </Heading>
            <br/>
          </div>
          <FormLayout >
            <TextField label="Api Key" name='company_Name' value={api_Key} onChange={e=>setApi_Key(e)}/>
            <Select options={options} onChange={handleDropDown} value={category} label="Make Api Call At"/>
            <TextField type="text" name='Warehouse Id' value={w_houseId} label="Warehouse Id" onChange={(e) =>setW_houseId(e)}/>
            <Button primary onClick={handleSubmit}>Save Changes</Button>
            <br/>
            <br/>
          </FormLayout>
        </div>
      </Page>
  );
};

export default Register;


