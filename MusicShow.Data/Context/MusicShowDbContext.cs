using Microsoft.EntityFrameworkCore;
using MusicShow.Domain.Entities;

namespace MusicShow.Data.Context;

/// <summary>
/// DbContext principal de la aplicación MusicShow.
/// </summary>
public class MusicShowDbContext : DbContext
{
    public MusicShowDbContext(DbContextOptions<MusicShowDbContext> options)
        : base(options) { }

    public DbSet<Instrumento> Instrumentos => Set<Instrumento>();
    public DbSet<Factura> Facturas => Set<Factura>();
    public DbSet<DetalleFactura> DetallesFactura => Set<DetalleFactura>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplica todas las configuraciones IEntityTypeConfiguration del ensamblado
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MusicShowDbContext).Assembly);
    }
}

