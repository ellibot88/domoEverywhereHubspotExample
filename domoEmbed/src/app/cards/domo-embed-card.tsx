import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  Alert,
  LoadingSpinner,
  Flex,
  Button,
} from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";
import { useCrmProperties } from "@hubspot/ui-extensions/crm";

hubspot.extend<'crm.record.tab'>(({ actions, context }) => <DomoEmbedCard openIframeModal={actions.openIframeModal} context={context} />);

interface DomoEmbedCardProps {
  openIframeModal: (action: {
    uri: string;
    title?: string;
    width: number;
    height: number;
  }) => void;
  context: any;
}

const DomoEmbedCard = ({ openIframeModal, context }: DomoEmbedCardProps) => {
  // Domo filter configuration - update filterColumn to match your Domo dataset column name
  const DOMO_FILTER_CONFIG = {
    filterColumn: 'companyId', // Update this to match your Domo dataset column name
    filterOperator: 'IN' as const,
  };

  // Get CRM properties to access company/record name
  const { properties } = useCrmProperties(["name", "company", "company_name", "id"]);
  const [embedToken, setEmbedToken] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get company name - try different property names based on object type
  const companyName = properties?.name || 
                      properties?.company || 
                      properties?.company_name ||
                      "Customer";
  
  // Get companyId for filtering
  const companyId = properties?.id;

  const loadDomoEmbed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(companyName);
      // Step 1: Get Domo access token using Basic Auth
      const clientId = 'clientId';
      const clientSecret = 'clientSecret';
      const embedId = 'embedId';
      
      const credentials = `${clientId}:${clientSecret}`;
      const encodedCredentials = btoa(credentials);
      const authHeader = `Basic ${encodedCredentials}`;
      
      const tokenResponse = await hubspot.fetch("https://api.domo.com/oauth/token?grant_type=client_credentials&scope=data%20audit%20user%20dashboard", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
        },
      });

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        throw new Error(`Domo Auth Error: ${tokenResponse.status} - ${errorBody}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error("No access token received from Domo");
      }

      // Step 2: Get embed authentication token with optional filtering
      const embedPayload = {
        sessionLength: 1440,
        authorizations: [
          {
            token: embedId,
            permissions: ["READ", "FILTER", "EXPORT"],
            filters: companyId ? [{
              column: DOMO_FILTER_CONFIG.filterColumn,
              operator: DOMO_FILTER_CONFIG.filterOperator,
              values: [companyId]
            }] : [],
          },
        ],
      };
      
      const embedEndpoint = "https://api.domo.com/v1/stories/embed/auth";

      const embedResponse = await hubspot.fetch(embedEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `bearer ${accessToken}`,
          
        },
        body: embedPayload,
      });

      if (!embedResponse.ok) {
        const errorBody = await embedResponse.text();
        throw new Error(`Domo Embed Auth Error: ${embedResponse.status} - ${errorBody}`);
      }

      const embedData = await embedResponse.json();

      if (!embedData.authentication) {
        throw new Error("No authentication token found in Domo embed response");
      }

      const token = embedData.authentication;
      const url = `https://public.domo.com/embed/pages/${embedId}`;

      setEmbedToken(token);
      setEmbedUrl(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load Domo dashboard. Please check your settings."
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]); // Re-fetch embed token when companyId changes

  useEffect(() => {
    loadDomoEmbed();
  }, [loadDomoEmbed]);

  if (loading) {
    return (
      <Flex direction="column" gap="md" align="center">
        <LoadingSpinner label="Loading Domo dashboard..." />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert title="Error" variant="error">
        {error}
      </Alert>
    );
  }

  if (!embedToken || !embedUrl) {
    return (
      <Alert title="Error" variant="error">
        No embed content available. Please check your settings.
      </Alert>
    );
  }

  const openDomoModal = () => {
    // Create HTML page that submits form to Domo with embed token
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Domo Embed</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
    #domo-iframe { width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body>
  <iframe id="domo-iframe" name="domo-iframe" src="about:blank" style="width: 100vw; height: 100vh; border: none;"></iframe>
  <script>
    (function() {
      var iframe = document.getElementById('domo-iframe');
      if (iframe) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = '${embedUrl}';
        form.target = 'domo-iframe';
        form.style.display = 'none';
        form.setAttribute('enctype', 'application/x-www-form-urlencoded');
        
        var tokenField = document.createElement('input');
        tokenField.type = 'hidden';
        tokenField.name = 'embedToken';
        tokenField.value = '${embedToken.replace(/'/g, "\\'")}';
        form.appendChild(tokenField);
        
        document.body.appendChild(form);
        form.submit();
        
        setTimeout(function() {
          if (form && form.parentNode) {
            form.parentNode.removeChild(form);
          }
        }, 2000);
      }
    })();
  </script>
</body>
</html>`;

    // Create a data URL from the HTML
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    
    // Open the iframe in a modal
    openIframeModal({
      uri: dataUrl,
      title: `${companyName}`,
      width: 1200,
      height: 800,
    });
  };

  return (
    <Flex direction="column" gap="md">
      <Button onClick={openDomoModal} type="button">
        {companyName} 360 Dashboard
      </Button>
    </Flex>
  );
};

