import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Route from '@ioc:Adonis/Core/Route'



Route.get("/teste", ({response}:HttpContextContract)=>{
    
    return response.json("success") 
})

Route.get("/teste2", ({response}:HttpContextContract)=>{
    
    return response.json("success2") 
})