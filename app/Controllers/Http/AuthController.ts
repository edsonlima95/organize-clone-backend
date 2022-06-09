// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import CreateUser from 'App/Validators/CreateUserValidator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Drive from '@ioc:Adonis/Core/Drive'
import User from "App/Models/User"
import Wallet from 'App/Models/Wallet'

interface Payload {
    email: string,
    password: string,
    errors?: []
}

interface Response {
    user: {
        id: number,
        name: string,
        email: string,
        cover?: string
    },
    wallet: {
        id: number,
        title: string,
        description?: string,
        user_id: number
    },
    token: string
}

export default class AuthController {


    async login({ auth, request, response }) {

        const { email, password } = request.body()

       
        const payload = await request.validate({
            schema: schema.create({
                email: schema.string([rules.email()]),
                password: schema.string([rules.minLength(4)]),
            }),
            messages: {
                email: "O e-mail não tem um formato válido",
                'email.required': 'O campo email é obrigatório',
                'password.required': 'O campo senha é obrigatório',
                'password.minLength': 'O senha deve ter no minimo 4 caracteres'
            }
        })

        if (payload?.erros) {
            return response.badRequest(payload)
        }

        try {

            const { token } = await auth.use('api').attempt(email, password, {
                expiresIn: "1days"
            })

            const wallet = await Wallet.query().where("user_id", auth.user.id).where("title", "Conta padrão").firstOrFail()

            const apiResponse: Response = {
                user: {
                    id: auth.user.id,
                    name: auth.user.name,
                    email: auth.user.email,
                    cover: auth.user.cover,
                },
                wallet: {
                    id: wallet.id,
                    title: wallet.title,
                    description: wallet.description,
                    user_id: wallet.user_id,
                },
                token
            }

            return apiResponse

        } catch {
            return response.badRequest({ errors: [{ message: "E-mail ou senha incorretos" }] })
        }

    }

    async signIn({ request, response }: HttpContextContract) {

        const payload = await request.validate(CreateUser) as Payload

        if (payload.errors) {
            return response.badRequest(payload)
        }

        const user = await User.create(payload)

        //Cria a carteira padrão
        await user.related("wallets").create({
            title: "Conta padrão",
            description: "carteira padrão",
        })

        //Cria uma categoria padrão
        await user.related("categories").create({
            title: "Outros",
            description: "categoria padrão",
        })

        // await Mail.sendLater((message) => {

        //     message
        //         .from(`${process.env.FROM_EMAIL}`)
        //         .to(payload.email)
        //         .subject('Seja bem-vindo ao myfinances')
        //         .htmlView('emails/welcome', { name: payload.name })
        // })

        return response.json({ message: "Cadastro realizado com successo" })

    }

    async profile({ request, response }: HttpContextContract) {

        const { id, name, email, password } = request.body()

        const coverImage = request.file('cover')

        const user = await User.findOrFail(id)

        if (coverImage) {
            await Drive.delete(`user/${user?.cover}`)
            await coverImage.moveToDisk('./user')
        }

        const fileName = coverImage?.fileName ?? user.cover


        const pass = password ? password : user.password

        const profile = await user.merge({ name, email, password: pass, cover: fileName }).save()

        return response.json({ message: "Perfil atualizado com successo", profile })

    }

    async cover({ params, response }: HttpContextContract) {

        const cover = await Drive.getStream(`user/${params.cover}`)

        return response.stream(cover);
    }

    public async checkToken({ response, auth }) {

        try {

            await auth.use('api').authenticate()
            return auth.use('api').isAuthenticated

        } catch {
            return response.unauthorized({ error: 'invalid token' })
        }
    }
}
