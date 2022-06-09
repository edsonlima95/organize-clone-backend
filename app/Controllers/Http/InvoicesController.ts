import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Invoice from 'App/Models/Invoice'
import dayjs from 'dayjs'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)


export default class InvoicesController {

  private PAGE_LIMIT: number = 10
  protected invoices: Invoice[]
  protected nextInvoices: Invoice[]
  protected nextExpenses: Invoice[]
  private startDate: string
  private endDate: string

  public async index({ request, response }: HttpContextContract) {

    const { user, wallet, page, start_date, end_date, invoice_type } = request.qs()

    if (start_date && start_date != 'undefined' && end_date && end_date != 'undefined' || invoice_type && invoice_type != 'all') {

      this.invoices = await this.filter(start_date, end_date, user, wallet, invoice_type, page)

    } else {

      this.invoices = await this.findByCurrentMonth(user, wallet, page)

    }

    const { income, expense } = await this.balance(user, wallet)

    return response.json({ invoices: this.invoices, income, expense })

  }

  public async store({ request, response }: HttpContextContract) {

    const { user_id, wallet_id, category_id, description, value, date, installments, invoice_type, type, period, status } = request.body()

    const { wallet, page } = request.qs()

    switch (type) {

      case 'single':

        await Invoice.create({ user_id, wallet_id, category_id, description, value, date, invoice_type, type })

        this.invoices = await this.findByCurrentMonth(user_id, wallet, page)

        this.nextInvoices = await this.nextInvoicesUnpaid(user_id, wallet)
        this.nextExpenses = await this.nextExpensesUnpaid(user_id, wallet)

        return response.json({ message: "Laçamento efetuado com sucesso", invoices: this.invoices, nextInvoices: this.nextInvoices, nextExpenses: this.nextExpenses })

      case 'fixed':

        const fixedCount = 37 // 3 anos

        const fixedUuid = cuid()

        for (let i = 1; i < fixedCount; i++) {

          const currentDate = dayjs(date).add(i, 'month').format("YYYY/MM/DD")

          await Invoice.create({ user_id, wallet_id, category_id, description, value, date: new Date(currentDate), invoice_type, type, period, status, installment_of: fixedUuid })

        }

      
        this.nextInvoices = await this.nextInvoicesUnpaid(user_id, wallet)
        this.nextExpenses = await this.nextExpensesUnpaid(user_id, wallet)

        this.invoices = await this.findByCurrentMonth(user_id, wallet, page)

        return response.json({ message: "Laçamento efetuado com sucesso", invoices: this.invoices, nextInvoices: this.nextInvoices, nextExpenses: this.nextExpenses })

      case 'split':

        const splitCount = installments ? parseInt(installments) + 1 : 1 // 1 ano

        /**
         * Gera o identificador unico das parcelas.
         */
        const splitUuid = cuid()

        for (let i = 1; i < splitCount; i++) {

          //Adiciona a quantidade de mês
          const currentDate = dayjs(date).add(i, 'month').format("YYYY/MM/DD")

          await Invoice.create({ user_id, wallet_id, category_id, description, value, date: new Date(currentDate), installment: i, installments, invoice_type, type, installment_of: splitUuid });
        }

        this.invoices = await this.findByCurrentMonth(user_id, wallet, page)

        this.nextInvoices = await this.nextInvoicesUnpaid(user_id, wallet)
        this.nextExpenses = await this.nextExpensesUnpaid(user_id, wallet)


        return response.json({ message: "Laçamento efetuado com sucesso", invoices: this.invoices, nextInvoices: this.nextInvoices, nextExpenses: this.nextExpenses })

      default:
        break;
    }

  }

  public async edit({ response, params }: HttpContextContract) {


    const invoice = await Invoice.findOrFail(params.id)

    await invoice.load("category")
    await invoice.load("wallet")

    return response.json(invoice)
  }

  public async update({ request, response, params }: HttpContextContract) {

    const { user_id, wallet_id, category_id, description, value, type, status, quantity } = request.body()

    const { wallet, page, invoice_type, start_date, end_date } = request.qs()

    switch (type) {

      case 'single':

        await Invoice.query()
          .where("id", params.id)
          .where("user_id", user_id)
          .where("type", "single")
          .update({ wallet_id, category_id, description, value, status })

        if (start_date != 'undefined' || end_date != 'undefined' || invoice_type == 'income' || invoice_type == 'expense') {

          this.invoices = await this.filter(start_date, end_date, user_id, wallet, invoice_type, page)

        } else {

          this.invoices = await this.findByCurrentMonth(user_id, wallet, page)

        }

        const { income, expense } = await this.balance(user_id, wallet)

        return response.json({ message: "Laçamento alterado com sucesso", invoices: this.invoices, income, expense })

      case 'fixed':

        if (!quantity) {
          return response.badRequest({ error: "Selecione uma opção" })
        }

        if (quantity === 'current') {

          await Invoice.query()
            .where("id", params.id)
            .where("user_id", user_id)
            .where("type", "fixed")
            .update({ wallet_id, category_id, description, value, status })
            .first()

          if (start_date != 'undefined' || end_date != 'undefined' || invoice_type == 'income' || invoice_type == 'expense') {

            this.invoices = await this.filter(start_date, end_date, user_id, wallet, invoice_type, page)

          } else {

            this.invoices = await this.findByCurrentMonth(user_id, wallet, page)

          }

          const { income, expense } = await this.balance(user_id, wallet)

          return response.json({ message: "Laçamento alterado com sucesso", invoices: this.invoices, income, expense })

        }

        if (quantity === 'all') {

          //Obtem a fatura pelo ID
          const invoice = await Invoice.query()
            .where("id", params.id)
            .where('user_id', user_id)
            .where("type", "fixed")
            .firstOrFail()

          //Busca todas as faturas do mesmo lançamento
          const allInvoices = await Invoice.query()
            .where("date", ">=", invoice.date)
            .where("installment_of", invoice.installment_of)


          for (const installment of allInvoices) {

            await installment.merge({ wallet_id, category_id, description, value, status })

            await installment.save()

          }

          if (start_date != 'undefined' || end_date != 'undefined' || invoice_type == 'income' || invoice_type == 'expense') {

            this.invoices = await this.filter(start_date, end_date, user_id, wallet, invoice_type, page)
          } else {

            this.invoices = await this.findByCurrentMonth(user_id, wallet, page)
          }

          const { income, expense } = await this.balance(user_id, wallet)

          return response.json({ message: "Laçamento alterado com sucesso", invoices: this.invoices, income, expense })

        }

      case 'split':

        if (!quantity) {
          return response.badRequest({ error: "Selecione uma opção" })
        }

        if (quantity === 'current') {

          await Invoice.query()
            .where("id", params.id)
            .where("user_id", user_id)
            .where("type", "split")
            .update({ wallet_id, category_id, description, value, status })
            .first()

          if (start_date != 'undefined' || end_date != 'undefined' || invoice_type == 'income' || invoice_type == 'expense') {
            this.invoices = await this.filter(start_date, end_date, user_id, wallet, invoice_type, page)
          } else {
            this.invoices = await this.findByCurrentMonth(user_id, wallet, page)
          }

          const { income, expense } = await this.balance(user_id, wallet)

          return response.json({ message: "Laçamento alterado com sucesso", invoices: this.invoices, income, expense })

        }

        if (quantity === 'all') {

          //Obtem a fatura pelo ID
          const invoice = await Invoice.query()
            .where("id", params.id)
            .where('user_id', user_id)
            .where("type", "split")
            .firstOrFail()

          //Busca todas as faturas do mesmo lançamento
          const allInvoices = await Invoice.query()
            .where("date", ">=", invoice.date)
            .where("installment_of", invoice.installment_of)

          for (const installment of allInvoices) {

            await installment.merge({ wallet_id, category_id, description, value, status })

            await installment.save()
          }

          if (start_date != 'undefined' || end_date != 'undefined' || invoice_type == 'income' || invoice_type == 'expense') {
            this.invoices = await this.filter(start_date, end_date, user_id, wallet, invoice_type, page)
          } else {
            this.invoices = await this.findByCurrentMonth(user_id, wallet, page)
          }

          const { income, expense } = await this.balance(user_id, wallet)

          return response.json({ message: "Laçamento alterado com sucesso", invoices: this.invoices, income, expense })

        }

      default:
        break;
    }

  }

  /**
   * OBS: como os dados estão vindo via query string, eles vem como string então o undefined
   * só ira surtir o efeito se for tratado como string tbm por isso foi colocado entre aspas.
   */

  public async destroy({ params, response, request }: HttpContextContract) {

    const { quantity, wallet, invoice_type, start_date, end_date, page } = request.qs()

    const invoice = await Invoice.findOrFail(params.id)

    if (quantity != 'undefined') {

      if (quantity == 'all') {

        await Invoice.query().where("installment_of", invoice.installment_of).delete()

        if (start_date != 'undefined' || end_date != 'undefined' || invoice_type != 'undefined') {
          this.invoices = await this.filter(start_date, end_date, invoice.user_id, wallet, invoice_type)
        } else {
          this.invoices = await this.findByCurrentMonth(invoice.user_id, wallet)
        }

        const { income, expense } = await this.balance(invoice.user_id, wallet)

        return response.json({ message: "Laçamento deletado com sucesso", invoices: this.invoices, income, expense })

      }

      if (quantity == 'current') {

        await invoice.delete()

        if (start_date != 'undefined' || end_date != 'undefined' || invoice_type != 'undefined') {

          this.invoices = await this.filter(start_date, end_date, invoice.user_id, wallet, invoice_type)
        } else {
          this.invoices = await this.findByCurrentMonth(invoice.user_id, wallet)
        }

        const { income, expense } = await this.balance(invoice.user_id, wallet)


        return response.json({ message: "Laçamento deletado com sucesso", invoices: this.invoices, income, expense })
      }

    }

    await invoice.delete()

    if (start_date != 'undefined' || end_date != 'undefined' || invoice_type != 'undefined') {

      this.invoices = await this.filter(start_date, end_date, invoice.user_id, wallet, invoice_type, page)

    } else {
      this.invoices = await this.findByCurrentMonth(invoice.user_id, wallet, page)
    }

    const { income, expense } = await this.balance(invoice.user_id, wallet)

    return response.json({ message: "Laçamento deletado com sucesso", invoices: this.invoices, income: income, expense: expense })


  }

  public async invoiceStatus({ request, params, response }: HttpContextContract) {

    const { start_date, end_date, invoice_type } = request.body()

    const { wallet, page, user } = request.qs()

    const invoice = await Invoice.findOrFail(params.id)

    invoice.status = !invoice.status

    await invoice.save()

    if (start_date || end_date || invoice_type == 'income' || invoice_type == 'expense') {

      this.invoices = await this.filter(start_date, end_date, user, wallet, invoice_type, page)

    } else {

      this.invoices = await this.findByCurrentMonth(user, wallet, page)

    }

    const { income, expense } = await this.balance(user, wallet)

    return response.json({ invoices: this.invoices, income: income, expense: expense })

  }

  private async findByCurrentMonth(user_id: number, wallet_id: number, page = 1) {

    const startDate = dayjs(new Date()).startOf("month").format("YYYY-MM-DD")
    const endDate = dayjs(startDate).endOf("month").format("YYYY-MM-DD")

    const invoices = await Invoice.query()
      .where("user_id", user_id)
      .where("wallet_id", wallet_id)
      .preload("category")
      .preload("wallet")
      .whereBetween("date", [startDate, endDate])
      .orderBy('id', 'desc')
      .paginate(page, this.PAGE_LIMIT)

    return invoices
  }

  private async filters({ request, response }: HttpContextContract) {

    const { page } = request.qs()

    const { start_date, end_date, user_id, wallet, invoice_type } = request.body()

    const invoices = await this.filter(start_date, end_date, user_id, wallet, invoice_type, page)

    return response.json({ invoices })

  }

  private async filter(start_date, end_date, user_id, wallet, invoice_type, page = 1) {

    if (start_date && end_date && invoice_type != 'all') {

      const startDate = dayjs(start_date).format("YYYY-MM-DD")
      const endDate = dayjs(end_date).format("YYYY-MM-DD")

      this.invoices = await Invoice.query()
        .where("user_id", user_id)
        .where("wallet_id", wallet)
        .where("invoice_type", invoice_type)
        .whereBetween("date", [startDate, endDate])
        .orderBy('id', 'asc')
        .preload("wallet")
        .preload("category")

        .paginate(page, this.PAGE_LIMIT)

      return this.invoices

    } else if (start_date && invoice_type != 'all') {

      this.invoices = await Invoice.query()
        .where("user_id", user_id)
        .where("wallet_id", wallet)
        .where("invoice_type", invoice_type)
        .where("date", start_date)
        .preload("wallet")
        .orderBy('id', 'asc')
        .preload("category")

        .paginate(page, this.PAGE_LIMIT)

      return this.invoices

    } else if (start_date && end_date && invoice_type == 'all') {



      const startDate = dayjs(start_date).format("YYYY-MM-DD")
      const endDate = dayjs(end_date).format("YYYY-MM-DD")

      this.invoices = await Invoice.query()
        .where("user_id", user_id)
        .where("wallet_id", wallet)
        .whereBetween("date", [startDate, endDate])
        .preload("wallet")
        .orderBy('id', 'asc')
        .preload("category")
        .paginate(page, this.PAGE_LIMIT)

      return this.invoices
    } else if (start_date) {

      this.invoices = await Invoice.query()
        .where("user_id", user_id)
        .where("wallet_id", wallet)
        .where("date", start_date)
        .preload("wallet")
        .orderBy('id', 'asc')
        .preload("category")

        .paginate(page, this.PAGE_LIMIT)

      return this.invoices
    } else if (invoice_type != "all") {
      this.invoices = await Invoice.query()
        .where("user_id", user_id)
        .where("wallet_id", wallet)
        .where("invoice_type", invoice_type)
        .preload("wallet")
        .orderBy('id', 'asc')
        .preload("category")

        .paginate(page, this.PAGE_LIMIT)

      return this.invoices

    } else {

      this.invoices = await this.findByCurrentMonth(user_id, wallet, page)

      return this.invoices
    }
  }

  private async balance(user: number, wallet: number) {

    const income = await Invoice.query()
      .where("user_id", user)
      .where("wallet_id", wallet)
      .where('invoice_type', 'income')
      .where("status", true)
      .sum("value")

    const expense = await Invoice.query()
      .where("user_id", user)
      .where("wallet_id", wallet)
      .where("status", true)
      .where('invoice_type', 'expense')
      .sum("value")

    const incomeSum = income[0].$extras.sum ? income[0].$extras.sum : 0
    const expenseSum = expense[0].$extras.sum ? expense[0].$extras.sum : 0

    return { income: incomeSum, expense: expenseSum }
  }

  protected async nextInvoicesUnpaid(user: number, wallet: number) {

    const startDate = dayjs().startOf('month').format("YYYY-MM-DD")
    const months = dayjs().add(5, "months").format("YYYY-MM-DD")

    const nextInvoices = await Invoice.query()
      .where("user_id", user)
      .where("wallet_id", wallet)
      .where('status', false)
      .whereBetween('date', [startDate, months])
      .where("invoice_type", "income")
      .limit(5).orderBy("date", "asc")

    return nextInvoices
  }

  protected async nextExpensesUnpaid(user: number, wallet: number) {

    const startDate = dayjs().startOf('month').format("YYYY-MM-DD")
    const months = dayjs().add(5, "months").format("YYYY-MM-DD")

    const nextExpenses = await Invoice.query()
      .where("user_id", user)
      .where("wallet_id", wallet)
      .where('status', false)
      .where("invoice_type", "expense")
      .whereBetween('date', [startDate, months])
      .limit(5).orderBy("date", "asc")

    return nextExpenses
  }

  private async report({ request, response }: HttpContextContract) {

    const { start_date, end_date, invoice_type, user_id, wallet_id } = request.body()

    if (start_date && end_date) {
      this.startDate = dayjs(start_date).format("YYYY-MM-DD")
      this.endDate = dayjs(end_date).format("YYYY-MM-DD")
    } else {
     
      this.startDate = dayjs(new Date()).startOf('month').format("YYYY-MM-DD")
      this.endDate = dayjs(this.startDate).endOf('month').format("YYYY-MM-DD")
    }

    if (invoice_type == 'all') {

      const invoices = await Invoice.query()
        .where("user_id", user_id)
        .where("wallet_id", wallet_id)
        .whereBetween("date", [this.startDate, this.endDate])
        .where('status', true)
        .select('id','description', 'date','value', 'invoice_type')

      const income = await Invoice.query()
        .where("user_id", user_id)
        .where("wallet_id", wallet_id)
        .whereBetween("date", [this.startDate, this.endDate])
        .where('invoice_type', 'income')
        .where('status', true)
        .sum('value')

      const expense = await Invoice.query()
        .where("user_id", user_id)
        .where("wallet_id", wallet_id)
        .whereBetween("date", [this.startDate, this.endDate])
        .where('invoice_type', 'expense')
        .where('status', true)
        .sum('value')

      const incomeTotal = income[0].$extras.sum ? income[0].$extras.sum : 0
      const expenseTotal = expense[0].$extras.sum ? expense[0].$extras.sum : 0
      const total = (incomeTotal - expenseTotal)

      return response.json({ invoices, total })
    }
  
    const invoices = await Invoice.query()
      .where("user_id", user_id)
      .where("wallet_id", wallet_id)
      .whereBetween("date", [this.startDate, this.endDate])
      .where('status', true)
      .where('invoice_type', invoice_type)
      .select('id','description','date','value', 'invoice_type')

    const invoiceTypeTotal = await Invoice.query()
      .where("user_id", user_id)
      .where("wallet_id", wallet_id)
      .whereBetween("date", [this.startDate, this.endDate])
      .where('invoice_type', invoice_type)
      .where('status', true)
      .sum('value')

    return response.json({ invoices, total: invoiceTypeTotal[0].$extras.sum })

  }

}
