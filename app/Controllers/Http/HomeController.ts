import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Invoice from 'App/Models/Invoice'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import InvoicesController from './InvoicesController'
dayjs.extend(utc)

export default class HomeController extends InvoicesController {

    
   
    async index({ request, response }: HttpContextContract) {

        
        const { user, wallet } = request.qs()
        
    
        const startDate = dayjs().startOf('month').format("YYYY-MM-DD")
        const endDate = dayjs().endOf('month').format("YYYY-MM-DD")

        const income = await Invoice.query()
            .where("user_id", user)
            .where("wallet_id", wallet)
            .where('invoice_type', 'income')
            .where("status", true)
            .whereBetween("date", [startDate, endDate])
            .sum("value")

        const expense = await Invoice.query()
            .where("user_id", user)
            .where("wallet_id", wallet)
            .where("status", true)
            .where('invoice_type', 'expense')
            .whereBetween("date", [startDate, endDate])
            .sum("value")

        this.nextInvoices = await this.nextInvoicesUnpaid(user, wallet)
        this.nextExpenses = await this.nextExpensesUnpaid(user, wallet)

        const total = income[0].$extras.sum - expense[0].$extras.sum

        return response.json({ income: income[0].$extras.sum, expense: expense[0].$extras.sum, total, nextInvoices: this.nextInvoices, nextExpenses: this.nextExpenses })
    }


    


}
