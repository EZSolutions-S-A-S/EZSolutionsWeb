import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  project_type: string;
  description: string;
  budget?: string;
  website?: string; // Honeypot field - should always be empty
}

// HTML escape function to prevent injection
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Rate limiting: track requests per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 3; // Max 3 requests per minute per IP

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  // Cleanup old entries occasionally
  if (Math.random() < 0.1) {
    for (const [key, times] of rateLimitMap.entries()) {
      if (times.every(time => now - time >= RATE_LIMIT_WINDOW)) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  return true;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Check if origin is allowed
function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  const allowedOrigins = [
    'https://ezsolutionssas.online',
    'https://www.ezsolutionssas.online',
    'http://localhost:3000', // Development
    'http://localhost:4321', // Astro dev
  ];
  
  if (origin && allowedOrigins.includes(origin)) return true;
  if (referer && allowedOrigins.some(allowed => referer.startsWith(allowed))) return true;
  
  return false;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Security check 1: Rate limiting
    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Security check 2: Origin validation
    if (!isValidOrigin(request)) {
      return new Response(
        JSON.stringify({ error: 'Solicitud no autorizada' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const bodyText = await request.text();

    if (!bodyText) {
      return new Response(
        JSON.stringify({ error: 'Body vacío - no se recibieron datos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let data: QuoteFormData;
    try {
      data = JSON.parse(bodyText);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'JSON inválido', details: parseError instanceof Error ? parseError.message : 'Error desconocido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.name || !data.email || !data.phone || !data.project_type || !data.description) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Security check 3: Honeypot validation (reject if filled)
    if (data.website) {
      // Silently reject spam bots that fill the honeypot field
      return new Response(
        JSON.stringify({ error: 'Solicitud rechazada' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Security check 4: Email format validation
    if (!isValidEmail(data.email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Security check 5: Input length validation (prevent abuse)
    const MAX_FIELD_LENGTH = 1000;
    if (
      data.name.length > MAX_FIELD_LENGTH ||
      data.phone.length > 20 ||
      data.project_type.length > MAX_FIELD_LENGTH ||
      data.description.length > 5000 ||
      (data.company && data.company.length > MAX_FIELD_LENGTH) ||
      (data.budget && data.budget.length > MAX_FIELD_LENGTH)
    ) {
      return new Response(
        JSON.stringify({ error: 'Algunos campos exceden la longitud máxima permitida' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const companyEmail = import.meta.env.RESEND_QUOTE_EMAIL || 'ezsolutionssas@example.com';
    const senderEmail = import.meta.env.RESEND_FROM_EMAIL || 'contacto@ezsolutionssas.online';

    // Escape all user inputs to prevent HTML injection
    const escapedName = escapeHtml(data.name);
    const escapedEmail = escapeHtml(data.email);
    const escapedPhone = escapeHtml(data.phone);
    const escapedCompany = data.company ? escapeHtml(data.company) : '';
    const escapedProjectType = escapeHtml(data.project_type);
    const escapedBudget = data.budget ? escapeHtml(data.budget) : '';
    // For description: escape first, then convert newlines to <br>
    const escapedDescription = escapeHtml(data.description).replace(/\n/g, '<br>');

    const emailContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1f2937; }
          .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #1e73be 0%, #005DAA 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 40px 20px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: 700; color: #005DAA; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-row { display: flex; margin-bottom: 12px; }
          .info-label { font-weight: 600; color: #1f2937; min-width: 120px; }
          .info-value { color: #6b7280; word-break: break-word; }
          .description-box { background: #f9fafb; border-left: 4px solid #005DAA; padding: 15px; border-radius: 4px; color: #4b5563; font-size: 14px; line-height: 1.6; }
          .footer { background: #f3f4f6; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-text { font-size: 12px; color: #6b7280; margin: 0; }
          .highlight { color: #005DAA; font-weight: 600; }
          .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Nueva Solicitud de Cotización</h1>
            <p>Tienes una nueva solicitud de un cliente potencial</p>
          </div>

          <div class="content">
            <div class="section">
              <div class="section-title">Información del Cliente</div>
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value"><strong>${escapedName}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value"><a href="mailto:${escapedEmail}" style="color: #005DAA; text-decoration: none;">${escapedEmail}</a></span>
              </div>
              <div class="info-row">
                <span class="info-label">Teléfono:</span>
                <span class="info-value"><a href="tel:${escapedPhone}" style="color: #005DAA; text-decoration: none;">${escapedPhone}</a></span>
              </div>
              ${escapedCompany ? `<div class="info-row">
                <span class="info-label">Empresa:</span>
                <span class="info-value">${escapedCompany}</span>
              </div>` : ''}
            </div>

            <div class="divider"></div>

            <div class="section">
              <div class="section-title">Detalles del Proyecto</div>
              <div class="info-row">
                <span class="info-label">Tipo:</span>
                <span class="info-value"><span class="highlight">${escapedProjectType}</span></span>
              </div>
              ${escapedBudget ? `<div class="info-row">
                <span class="info-label">Presupuesto:</span>
                <span class="info-value"><strong>${escapedBudget}</strong></span>
              </div>` : ''}
            </div>

            <div class="section">
              <div class="section-title">Descripción</div>
              <div class="description-box">
                ${escapedDescription}
              </div>
            </div>

            <div class="divider"></div>

            <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px; color: #005DAA; font-weight: 600;">
                Responde directamente a este email para ponerte en contacto con el cliente
              </p>
            </div>
          </div>

          <div class="footer">
            <p class="footer-text">© 2026 EZ Solutions. Todos los derechos reservados.</p>
            <p class="footer-text" style="margin-top: 8px;">Este es un email automático generado desde tu formulario de cotización.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await resend.emails.send({
      from: senderEmail,
      to: companyEmail,
      subject: `Nueva Cotización - ${escapedName}`,
      html: emailContent,
      replyTo: data.email,
    });

    if (response.error) {
      return new Response(
        JSON.stringify({ error: 'No se pudo enviar el email', details: response.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cotización enviada correctamente',
        emailId: response.data?.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
