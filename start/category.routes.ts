import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {

    Route.resource("/categories", 'CategoriesController').except(['create','show'])

}).prefix('api').middleware('auth')
