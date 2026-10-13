using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MusicShow.Domain.Entities;

namespace MusicShow.Data.Configurations;

/// <summary>
/// Configuración de mapeo de la entidad Factura para EF Core (Fluent API).
/// </summary>
public class FacturaConfiguration : IEntityTypeConfiguration<Factura>
{
    public void Configure(EntityTypeBuilder<Factura> builder)
    {
        builder.ToTable("Facturas");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.NumeroComprobante)
               .IsRequired()
               .HasMaxLength(25);

        builder.HasIndex(f => f.NumeroComprobante)
               .IsUnique();

        builder.Property(f => f.TipoComprobante)
               .IsRequired()
               .HasMaxLength(50);

        builder.Property(f => f.PuntoVenta)
               .IsRequired();

        builder.Property(f => f.FechaEmision)
               .IsRequired();

        builder.Property(f => f.NombreCliente)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(f => f.DocumentoCliente)
               .HasMaxLength(20);

        builder.Property(f => f.MetodoPago)
               .IsRequired()
               .HasMaxLength(30);

        builder.Property(f => f.SubtotalNeto)
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        builder.Property(f => f.Iva)
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        builder.Property(f => f.Total)
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        builder.Property(f => f.CAE)
               .IsRequired()
               .HasMaxLength(14);

        builder.Property(f => f.VencimientoCAE)
               .IsRequired();

        builder.Property(f => f.Estado)
               .IsRequired()
               .HasMaxLength(20);

        // Relación 1:N con DetalleFactura — elimina detalles en cascada
        builder.HasMany(f => f.Detalles)
               .WithOne(d => d.Factura)
               .HasForeignKey(d => d.FacturaId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}

