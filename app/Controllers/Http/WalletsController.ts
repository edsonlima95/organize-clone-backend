import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Wallet from 'App/Models/Wallet'


export default class WalletsController {

  
  public async index({ request, response }: HttpContextContract) {

    const { user_id } = request.qs()


    const user = await User.findOrFail(user_id)

    await user.load('wallets')

    await user.load((loader) => {
      loader.load('wallets', (wallets) => {
        wallets.preload("invoices")

      })
    })
   
    return response.json({wallets:user.wallets})

  }


  public async store({ request, response }: HttpContextContract) {

    const { title, description, user_id } = request.body()

    const wallet = await Wallet.create({ title, description, user_id })

    const wallets = await Wallet.query().where("user_id", wallet.user_id)

    return response.json({ message: "Carteira cadastrada com sucesso", wallets })

  }

  public async show({ }: HttpContextContract) { }

  public async edit({ }: HttpContextContract) { }

  public async update({ request, response }: HttpContextContract) {

    const { id, title, description, user_id } = request.body()

    const wallet = await Wallet.findOrFail(id)

    await wallet.merge({ title, description, user_id }).save()

    const wallets = await Wallet.query().where("user_id", wallet.user_id)

    return response.json({ message: "Carteira alterada com sucesso", wallets })
  }

  public async destroy({ params, response }: HttpContextContract) {

    const wallet = await Wallet.findOrFail(params.id)

    await wallet.delete()

    const wallets = await Wallet.query().where("user_id", wallet.user_id)

    return response.json({ message: "Carteira excluida com sucesso", wallets })

  }
}
