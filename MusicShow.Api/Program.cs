using Microsoft.EntityFrameworkCore;
using MusicShow.Application.Interfaces;
using MusicShow.Application.Services;
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

        // ── Servicios de aplicación ────────────────────────────────────────────
        builder.Services.AddScoped<IInstrumentoService, InstrumentoService>();

        // ── Controladores ──────────────────────────────────────────────────────
        builder.Services.AddControllers();

        // ── Swagger / OpenAPI ──────────────────────────────────────────────────
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // ── Pipeline HTTP ──────────────────────────────────────────────────────
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "MusicShow API v1");
                c.RoutePrefix = string.Empty; // Swagger en la raíz
            });
        }

        app.UseHttpsRedirection();
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }
}

