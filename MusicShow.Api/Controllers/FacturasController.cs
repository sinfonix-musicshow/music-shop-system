using Microsoft.AspNetCore.Mvc;
using MusicShow.Application.DTOs.Facturas;
using MusicShow.Application.Interfaces;
using MusicShow.Domain.Exceptions;

namespace MusicShow.Api.Controllers;

/// <summary>
/// Controlador para la facturación rápida en mostrador e historial de comprobantes (UC2).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class FacturasController : ControllerBase
{
    private readonly IFacturaService _service;

    public FacturasController(IFacturaService service)
    {
        _service = service;
    }

    // POST /api/facturas
    /// <summary>
    /// Emite una nueva factura. Valida stock, descuenta inventario y simula CAE (ARCA).
    /// Toda la operación es atómica: si falla alguna validación se revierte la transacción.
    /// </summary>
    /// <response code="201">Factura emitida exitosamente.</response>
    /// <response code="400">Datos inválidos o instrumento inactivo/inexistente.</response>
    /// <response code="409">Stock insuficiente para uno o más productos.</response>
    [HttpPost]
    [ProducesResponseType(typeof(FacturaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Emitir([FromBody] CrearFacturaDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var factura = await _service.EmitirAsync(dto);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = factura.Id }, factura);
        }
        catch (StockInsuficienteException ex)
        {
            return Conflict(new
            {
                mensaje            = ex.Message,
                instrumentoId      = ex.InstrumentoId,
                nombreInstrumento  = ex.NombreInstrumento,
                stockDisponible    = ex.StockDisponible,
                cantidadSolicitada = ex.CantidadSolicitada
            });
        }
        catch (DomainException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    // GET /api/facturas?q=B-00005
    /// <summary>
    /// Devuelve el historial de comprobantes ordenado por fecha descendente.
    /// Permite filtrar por número de comprobante o nombre de cliente.
    /// </summary>
    /// <param name="q">Texto de búsqueda (número de comprobante o cliente).</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<FacturaHistorialItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerHistorial([FromQuery] string? q)
    {
        var historial = await _service.ObtenerHistorialAsync(q);
        return Ok(historial);
    }

    // GET /api/facturas/{id}
    /// <summary>
    /// Obtiene el detalle completo de una factura por ID para reimpresión o consulta.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(FacturaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var factura = await _service.ObtenerPorIdAsync(id);
        if (factura is null)
            return NotFound(new { mensaje = $"No se encontró la factura con Id {id}." });

        return Ok(factura);
    }
}

