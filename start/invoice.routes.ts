import Route from '@ioc:Adonis/Core/Route'


Route.group(() => {

    Route.post("/invoices/status/:id","InvoicesController.invoiceStatus")
    Route.post("/invoices/filter","InvoicesController.filters")
    Route.post("/invoices/balance","InvoicesController.walletBalance")
    Route.resource("/invoices", 'InvoicesController').except(['create','show'])
    // Route.post("/invoices/report","HomeController.report")
    
}).prefix('api').middleware('auth')
Route.group(() => {

    Route.post("/invoices/report","HomeController.report")
    
}).prefix('api')