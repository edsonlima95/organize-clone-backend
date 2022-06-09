import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, BaseModel, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Wallet from './Wallet'
import Category from './Category'

export default class User extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public email: string

  @column()
  public cover?: string

  @column({ serializeAs: null })
  public password: string

  @hasMany(() => Wallet, {
    foreignKey: 'user_id'
  })

  public wallets: HasMany<typeof Wallet>

  @hasMany(() => Category, {
    foreignKey: 'user_id'
  })
  public categories: HasMany<typeof Category>

  @column()
  public rememberMeToken?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }
}
