using Microsoft.AspNetCore;
using FinanceManager.Data;
using FinanceManager.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionController(AppDbContext context)
    {
        _context = context;
    }

    
    //Filtrar transações
    [HttpGet("filter")]
    public async Task<ActionResult<IEnumerable<Transaction>>> GetTransactions(
        [FromQuery] string type,
        [FromQuery] string category)
    {
        //aqui começa a consultar transações
        var querry = _context.Transactions.AsQueryable();

        //aqui filtra por tipo
        if(!string.IsNullOrEmpty(type))
        {
            querry = querry.Where(t => t.Type == type);
        }

        //aqui filtra por categoria
        if(!string.IsNullOrEmpty(category))
        {
            querry = querry.Where(t => t.Category == category);
        }

        //retorna o que foi filtrado
        return await querry.ToListAsync();  
    }


    //Lista as transações
    [HttpGet]
    public IActionResult GetAll()
    {
        var transactions = _context.Transactions.ToList();
        return Ok(transactions);
    }

    [HttpGet("report/summary")]
    public async Task<ActionResult<TransactionSummary>> GetTransactionSummary()
    {
        //Total de receitas
        var totalIncome = await _context.Transactions
            .Where(t => t.Type == "Income")
            .SumAsync(t => t.Amount);

        //Total de despesas
        var totalExpense = await _context.Transactions
            .Where(t => t.Type == "Expense")
            .SumAsync(t => t.Amount);

        //Resultados
        var summary = new TransactionSummary
        {
            TotalIncome = totalIncome,
            TotalExpense = totalExpense
        };

        return Ok(summary);
    }


    //Adiciona novas transações
    [HttpPost]
    public IActionResult Create(Transaction transaction)
    {
        _context.Transactions.Add(transaction);
        _context.SaveChanges();
        return CreatedAtAction(nameof(Create), new { id = transaction.Id }, transaction);
    }

    /*
    //Atualiza uma transação
    [HttpPut("{id}")]
    public IActionResult Update (int id, Transaction updatedTransaction)
    {
        var transaction = _context.Transactions.Find(id);
        if(transaction == null) 
        {
            return NotFound();
        }

        //atualiza campos
        transaction.Amount = updatedTransaction.Amount;
        transaction.Type = updatedTransaction.Type;
        transaction.Category = updatedTransaction.Category;
        transaction.Description = updatedTransaction.Description;
        transaction.Date = updatedTransaction.Date;

        _context.SaveChanges();
        return NoContent();
    }
    */


    //Deleta uma transação
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var transaction = _context.Transactions.Find(id);
        if (transaction == null)
            return NotFound();

        _context.Transactions.Remove(transaction);
        _context.SaveChanges();
        return NoContent();
    }

}
