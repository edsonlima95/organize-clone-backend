import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateUserValidator {
  constructor(protected ctx: HttpContextContract) { }


  public schema = schema.create({
    name: schema.string(),
    email: schema.string([rules.email(), rules.unique({ table: 'users', column: 'email' })]),
    password: schema.string([
      rules.minLength(4)
    ])
  })

  public messages = {
    'name.required': 'O campo nome é obrigatório',
    'email.required': 'O campo email é obrigatório',
    'password.required': 'O campo senha é obrigatório',
    unique: 'O {{field}} já existe',
    email: "O e-mail deve ter um formato válido",
    'password.minLength': "A senha deve ter no minimo 4 caracteres"
  }
}
