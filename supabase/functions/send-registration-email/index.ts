
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamMember {
  member_name: string;
  member_age: number;
}

interface RegistrationData {
  team_name: string;
  captain_name: string;
  email: string;
  phone_number: string;
  age_range: string;
  soapbox_name: string;
  design_description: string;
  dimensions: string;
  brakes_steering: string;
  participants_count: number;
  file_url?: string;
}

interface RequestBody {
  registrationData: RegistrationData;
  teamMembers: TeamMember[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registrationData, teamMembers }: RequestBody = await req.json();

    // Generate team members HTML
    const teamMembersHtml = teamMembers.map((member, index) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${member.member_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${member.member_age}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #d73527; margin-bottom: 10px;">Castle Douglas Soapbox Derby 2026</h1>
              <h2 style="color: #2563eb; margin-top: 0;">Team Registration Confirmation</h2>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #d73527; margin-top: 0;">Team Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Team Name:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.team_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Captain Name:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.captain_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Email:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Phone:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.phone_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Age Range:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.age_range || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Participants:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.participants_count}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #d73527; margin-top: 0;">Soapbox Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Soapbox Name:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.soapbox_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Dimensions:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.dimensions}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Design Description:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.design_description}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Brakes & Steering:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.brakes_steering}</td>
                </tr>
                ${registrationData.file_url ? `
                <tr>
                  <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; background-color: #e9ecef;">Uploaded File:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;"><a href="${registrationData.file_url}" target="_blank">View File</a></td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #d73527; margin-top: 0;">Team Members</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #e9ecef;">#</th>
                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #e9ecef;">Name</th>
                    <th style="padding: 8px; border: 1px solid #ddd; background-color: #e9ecef;">Age</th>
                  </tr>
                </thead>
                <tbody>
                  ${teamMembersHtml}
                </tbody>
              </table>
            </div>

            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; border-left: 4px solid #0c5460;">
              <p style="margin: 0; color: #0c5460;">
                <strong>Registration submitted successfully!</strong><br>
                We'll be in touch with further details about the Castle Douglas Soapbox Derby 2026.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px;">
                Castle Douglas Soapbox Derby 2026<br>
                For questions, please contact: castledouglassoapboxderby@hotmail.com
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Castle Douglas Soapbox Derby <onboarding@resend.dev>",
      to: ["castledouglassoapboxderby@hotmail.com"],
      subject: `New Team Registration: ${registrationData.team_name}`,
      html: emailHtml,
    });

    console.log("Registration email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending registration email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
