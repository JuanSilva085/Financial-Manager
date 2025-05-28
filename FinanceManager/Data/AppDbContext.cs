using Microsoft.EntityFrameworkCore;
using FinanceManager.Models;

namespace FinanceManager.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Transaction> Transactions { get; set; }
}
