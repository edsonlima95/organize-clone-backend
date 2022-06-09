import Route from '@ioc:Adonis/Core/Route'



Route.group(() => {

    Route.resource("/wallets","WalletsController").except(['create','show'])

}).prefix("api").middleware('auth')