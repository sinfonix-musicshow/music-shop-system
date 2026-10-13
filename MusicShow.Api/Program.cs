using Microsoft.EntityFrameworkCore;
using MusicShow.Application.Interfaces;
using MusicShow.Application.Services;
using MusicShow.Data;
using MusicShow.Data.Context;
using MusicShow.Data.Repositories;
using MusicShow.Domain.Interfaces;

namespace MusicShow.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // ── Base de datos ──────────────────────────────────────────────────────
        builder.Services.AddDbContext<MusicShowDbContext>(options =>
            options.UseSqlServer(
                builder.Configuration.GetConnectionString("DefaultConnection")));

        // ── Repositorios ───────────────────────────────────────────────────────
        builder.Services.AddScoped<IInstrumentoRepository, InstrumentoRepository>();
        builder.Services.AddScoped<IFacturaRepository, FacturaRepository>();

        // ── Unit of Work ───────────────────────────────────────────────────────
        builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

        // ── Servicios de aplicación ────────────────────────────────────────────
        builder.Services.AddScoped<IInstrumentoService, InstrumentoService>();
        builder.Services.AddScoped<IFacturaService, FacturaService>();

        // ── Controladores ──────────────────────────────────────────────────────
        builder.Services.AddControllers();

        // ── CORS — permite consumo desde el prototipo HTML ─────────────────────
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("PermitirTodo", policy =>
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader());
        });

        // ── Swagger / OpenAPI ──────────────────────────────────────────────────
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // ── Pipeline HTTP ──────────────────────────────────────────────────────
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors("PermitirTodo");

        app.UseHttpsRedirection();
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }
}

