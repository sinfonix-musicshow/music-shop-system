using Microsoft.AspNetCore.Mvc;
using MusicShow.Application.DTOs.Instrumentos;
using MusicShow.Application.Interfaces;
using MusicShow.Domain.Exceptions;

namespace MusicShow.Api.Controllers;

/// <summary>
/// Controlador para la gestión de inventario y stock de instrumentos (UC1).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class InstrumentosController : ControllerBase
{
    private readonly IInstrumentoService _service;

    public InstrumentosController(IInstrumentoService service)
    {
        _service = service;
    }

    // GET /api/instrumentos?busqueda=guitarra&categoria=Cuerdas
    /// <summary>
    /// Lista todos los instrumentos activos con soporte de búsqueda y filtrado por categoría.
    /// </summary>
    /// <param name="busqueda">Texto libre — busca en nombre, código y marca.</param>
    /// <param name="categoria">Filtra por categoría exacta (ej. Cuerdas, Viento, Percusión).</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<InstrumentoResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerTodos(
        [FromQuery] string? busqueda,
        [FromQuery] string? categoria)
    {
        var resultado = await _service.ObtenerTodosAsync(busqueda, categoria);
        return Ok(resultado);
    }

    // GET /api/instrumentos/{id}
    /// <summary>
    /// Obtiene el detalle de un instrumento por su identificador.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(InstrumentoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var resultado = await _service.ObtenerPorIdAsync(id);
        if (resultado is null)
            return NotFound(new { mensaje = $"No se encontró el instrumento con Id {id}." });

        return Ok(resultado);
    }

    // POST /api/instrumentos
    /// <summary>
    /// Registra un nuevo instrumento. Valida que el código no esté duplicado.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(InstrumentoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Crear([FromBody] CrearInstrumentoRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var resultado = await _service.CrearAsync(request);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = resultado.Id }, resultado);
        }
        catch (DomainException ex) when (ex.Message.Contains("código"))
        {
            return Conflict(new { mensaje = ex.Message });
        }
        catch (DomainException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    // PUT /api/instrumentos/{id}
    /// <summary>
    /// Modifica los datos generales del instrumento (nombre, marca, categoría, precio, emoji).
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(InstrumentoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarInstrumentoRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var resultado = await _service.ActualizarAsync(id, request);
            return Ok(resultado);
        }
        catch (DomainException ex) when (ex.Message.Contains("encontró"))
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (DomainException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    // PATCH /api/instrumentos/{id}/stock
    /// <summary>
    /// Ajusta el stock del instrumento. Soporta delta relativo y cantidad absoluta.
    /// Rechaza cualquier operación que resulte en stock negativo.
    /// </summary>
    [HttpPatch("{id:int}/stock")]
    [ProducesResponseType(typeof(InstrumentoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AjustarStock(int id, [FromBody] AjustarStockRequest request)
    {
        try
        {
            var resultado = await _service.AjustarStockAsync(id, request);
            return Ok(resultado);
        }
        catch (DomainException ex) when (ex.Message.Contains("encontró"))
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (DomainException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    // DELETE /api/instrumentos/{id}
    /// <summary>
    /// Realiza la baja lógica del instrumento (Activo = false).
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Eliminar(int id)
    {
        try
        {
            await _service.EliminarAsync(id);
            return NoContent();
        }
        catch (DomainException ex) when (ex.Message.Contains("encontró"))
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }
}

