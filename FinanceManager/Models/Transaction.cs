using System;

namespace FinanceManager.Models;

public class Transaction
{
    public int Id { get; set; } 
    public decimal Amount { get; set; }
    public string? Type { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public DateTime Date { get; set; }
}
