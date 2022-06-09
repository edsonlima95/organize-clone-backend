import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Category from 'App/Models/Category'
import User from 'App/Models/User'

export default class CategoriesController {


  public async index({ request, response }: HttpContextContract) {

    const { user_id } = request.qs()

    const user = await User.findOrFail(user_id)

    await user.load('categories', (query) => {
      query.orderBy('id', 'desc')
    })

    return response.json({ categories: user.categories })

  }


  public async store({ request, response }: HttpContextContract) {
    const { title, description, user_id } = request.body()

    await Category.create({ title, description, user_id })

    const categories = await Category.query().where('user_id', user_id).orderBy('id', 'desc')

    return response.json({ message: "Categoria cadastrada com sucesso", categories })
  }



  public async edit({ }: HttpContextContract) { }

  public async update({ request, response, params }: HttpContextContract) {

    const { title, description, user_id } = request.body()

    const category = await Category.findOrFail(params.id)

    await category.merge({ title, description, user_id }).save()

    const categories = await Category.query().where('user_id', user_id).orderBy('id', 'desc')

    return response.json({ message: "Categoria alterada com sucesso", categories })
  }

  public async destroy({ response, params }: HttpContextContract) {

    const category = await Category.findOrFail(params.id)

    await category?.delete()

    const categories = await Category.query().where('user_id', category.user_id).orderBy('id', 'desc')

    return response.json({ message: "Categoria deletada com sucesso", categories })

  }
}
