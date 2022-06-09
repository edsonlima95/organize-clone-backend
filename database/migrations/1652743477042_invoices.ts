import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Invoices extends BaseSchema {
  protected tableName = 'invoices'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer("user_id").unsigned().references('users.id').onDelete("CASCADE").notNullable()
      table.integer("wallet_id").unsigned().references('wallets.id').onDelete("CASCADE").notNullable()
      table.integer("category_id").unsigned().references('categories.id').onDelete("CASCADE").notNullable()
      table.string("installment_of").nullable()

      table.string("description").notNullable()

      table.decimal("value", 10, 2).notNullable()
      table.date("date").notNullable()

      table.integer("installment").notNullable().defaultTo(1)
      table.integer("installments").notNullable().defaultTo(1)

      table.string("invoice_type").notNullable()
      table.string("type").notNullable()
      table.string("period").notNullable().defaultTo("month")

      table.boolean("status").notNullable().defaultTo(false)

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
