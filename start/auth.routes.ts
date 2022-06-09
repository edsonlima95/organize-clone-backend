import Route from '@ioc:Adonis/Core/Route'


Route.group(() => {

    Route.post("/signin", 'AuthController.signIn')
    Route.post("/login", 'AuthController.login')
    Route.get("/check-token", 'AuthController.checkToken')
    Route.get("/profile/:cover","AuthController.cover")

    Route.group(() => {
        Route.post("/profile", 'AuthController.profile')
    }).middleware('auth')

}).prefix('api')


