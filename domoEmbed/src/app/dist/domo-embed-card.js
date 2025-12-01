(function(React2, uiExtensions2, crm2) {
  "use strict";
  uiExtensions2.hubspot.extend(({ actions, context }) => /* @__PURE__ */ React2.createElement(DomoEmbedCard, { openIframeModal: actions.openIframeModal, context }));
  const DomoEmbedCard = ({ openIframeModal, context }) => {
    const DOMO_FILTER_CONFIG = {
      filterColumn: "companyId",
      // Update this to match your Domo dataset column name
      filterOperator: "IN"
    };
    const { properties } = crm2.useCrmProperties(["name", "company", "company_name", "id"]);
    const [embedToken, setEmbedToken] = React2.useState(null);
    const [embedUrl, setEmbedUrl] = React2.useState(null);
    const [loading, setLoading] = React2.useState(true);
    const [error, setError] = React2.useState(null);
    const companyName = (properties == null ? void 0 : properties.name) || (properties == null ? void 0 : properties.company) || (properties == null ? void 0 : properties.company_name) || "Customer";
    const companyId = properties == null ? void 0 : properties.id;
    const loadDomoEmbed = React2.useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(companyName);
        const clientId = "clientId";
        const clientSecret = "clientSecret";
        const embedId = "embedId";
        const credentials = `${clientId}:${clientSecret}`;
        const encodedCredentials = btoa(credentials);
        const authHeader = `Basic ${encodedCredentials}`;
        const tokenResponse = await uiExtensions2.hubspot.fetch("https://api.domo.com/oauth/token?grant_type=client_credentials&scope=data%20audit%20user%20dashboard", {
          method: "POST",
          headers: {
            "Authorization": authHeader
          }
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
              }] : []
            }
          ]
        };
        const embedEndpoint = "https://api.domo.com/v1/stories/embed/auth";
        const embedResponse = await uiExtensions2.hubspot.fetch(embedEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `bearer ${accessToken}`
          },
          body: embedPayload
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
          err instanceof Error ? err.message : "Failed to load Domo dashboard. Please check your settings."
        );
      } finally {
        setLoading(false);
      }
    }, [companyId]);
    React2.useEffect(() => {
      loadDomoEmbed();
    }, [loadDomoEmbed]);
    if (loading) {
      return /* @__PURE__ */ React2.createElement(uiExtensions2.Flex, { direction: "column", gap: "md", align: "center" }, /* @__PURE__ */ React2.createElement(uiExtensions2.LoadingSpinner, { label: "Loading Domo dashboard..." }));
    }
    if (error) {
      return /* @__PURE__ */ React2.createElement(uiExtensions2.Alert, { title: "Error", variant: "error" }, error);
    }
    if (!embedToken || !embedUrl) {
      return /* @__PURE__ */ React2.createElement(uiExtensions2.Alert, { title: "Error", variant: "error" }, "No embed content available. Please check your settings.");
    }
    const openDomoModal = () => {
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
  <\/script>
</body>
</html>`;
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      openIframeModal({
        uri: dataUrl,
        title: `${companyName}`,
        width: 1200,
        height: 800
      });
    };
    return /* @__PURE__ */ React2.createElement(uiExtensions2.Flex, { direction: "column", gap: "md" }, /* @__PURE__ */ React2.createElement(uiExtensions2.Button, { onClick: openDomoModal, type: "button" }, companyName, " 360 Dashboard"));
  };
})(React, uiExtensions, crm);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tby1lbWJlZC1jYXJkLmpzIiwic291cmNlcyI6WyIuLi9jYXJkcy9kb21vLWVtYmVkLWNhcmQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VDYWxsYmFjayB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHtcbiAgVGV4dCxcbiAgQWxlcnQsXG4gIExvYWRpbmdTcGlubmVyLFxuICBGbGV4LFxuICBCdXR0b24sXG59IGZyb20gXCJAaHVic3BvdC91aS1leHRlbnNpb25zXCI7XG5pbXBvcnQgeyBodWJzcG90IH0gZnJvbSBcIkBodWJzcG90L3VpLWV4dGVuc2lvbnNcIjtcbmltcG9ydCB7IHVzZUNybVByb3BlcnRpZXMgfSBmcm9tIFwiQGh1YnNwb3QvdWktZXh0ZW5zaW9ucy9jcm1cIjtcblxuaHVic3BvdC5leHRlbmQ8J2NybS5yZWNvcmQudGFiJz4oKHsgYWN0aW9ucywgY29udGV4dCB9KSA9PiA8RG9tb0VtYmVkQ2FyZCBvcGVuSWZyYW1lTW9kYWw9e2FjdGlvbnMub3BlbklmcmFtZU1vZGFsfSBjb250ZXh0PXtjb250ZXh0fSAvPik7XG5cbmludGVyZmFjZSBEb21vRW1iZWRDYXJkUHJvcHMge1xuICBvcGVuSWZyYW1lTW9kYWw6IChhY3Rpb246IHtcbiAgICB1cmk6IHN0cmluZztcbiAgICB0aXRsZT86IHN0cmluZztcbiAgICB3aWR0aDogbnVtYmVyO1xuICAgIGhlaWdodDogbnVtYmVyO1xuICB9KSA9PiB2b2lkO1xuICBjb250ZXh0OiBhbnk7XG59XG5cbmNvbnN0IERvbW9FbWJlZENhcmQgPSAoeyBvcGVuSWZyYW1lTW9kYWwsIGNvbnRleHQgfTogRG9tb0VtYmVkQ2FyZFByb3BzKSA9PiB7XG4gIC8vIERvbW8gZmlsdGVyIGNvbmZpZ3VyYXRpb24gLSB1cGRhdGUgZmlsdGVyQ29sdW1uIHRvIG1hdGNoIHlvdXIgRG9tbyBkYXRhc2V0IGNvbHVtbiBuYW1lXG4gIGNvbnN0IERPTU9fRklMVEVSX0NPTkZJRyA9IHtcbiAgICBmaWx0ZXJDb2x1bW46ICdjb21wYW55SWQnLCAvLyBVcGRhdGUgdGhpcyB0byBtYXRjaCB5b3VyIERvbW8gZGF0YXNldCBjb2x1bW4gbmFtZVxuICAgIGZpbHRlck9wZXJhdG9yOiAnSU4nIGFzIGNvbnN0LFxuICB9O1xuXG4gIC8vIEdldCBDUk0gcHJvcGVydGllcyB0byBhY2Nlc3MgY29tcGFueS9yZWNvcmQgbmFtZVxuICBjb25zdCB7IHByb3BlcnRpZXMgfSA9IHVzZUNybVByb3BlcnRpZXMoW1wibmFtZVwiLCBcImNvbXBhbnlcIiwgXCJjb21wYW55X25hbWVcIiwgXCJpZFwiXSk7XG4gIGNvbnN0IFtlbWJlZFRva2VuLCBzZXRFbWJlZFRva2VuXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZW1iZWRVcmwsIHNldEVtYmVkVXJsXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgXG4gIC8vIEdldCBjb21wYW55IG5hbWUgLSB0cnkgZGlmZmVyZW50IHByb3BlcnR5IG5hbWVzIGJhc2VkIG9uIG9iamVjdCB0eXBlXG4gIGNvbnN0IGNvbXBhbnlOYW1lID0gcHJvcGVydGllcz8ubmFtZSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzPy5jb21wYW55IHx8IFxuICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM/LmNvbXBhbnlfbmFtZSB8fFxuICAgICAgICAgICAgICAgICAgICAgIFwiQ3VzdG9tZXJcIjtcbiAgXG4gIC8vIEdldCBjb21wYW55SWQgZm9yIGZpbHRlcmluZ1xuICBjb25zdCBjb21wYW55SWQgPSBwcm9wZXJ0aWVzPy5pZDtcblxuICBjb25zdCBsb2FkRG9tb0VtYmVkID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBzZXRMb2FkaW5nKHRydWUpO1xuICAgICAgc2V0RXJyb3IobnVsbCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKGNvbXBhbnlOYW1lKTtcbiAgICAgIC8vIFN0ZXAgMTogR2V0IERvbW8gYWNjZXNzIHRva2VuIHVzaW5nIEJhc2ljIEF1dGhcbiAgICAgIGNvbnN0IGNsaWVudElkID0gJ2NsaWVudElkJztcbiAgICAgIGNvbnN0IGNsaWVudFNlY3JldCA9ICdjbGllbnRTZWNyZXQnO1xuICAgICAgY29uc3QgZW1iZWRJZCA9ICdlbWJlZElkJztcbiAgICAgIFxuICAgICAgY29uc3QgY3JlZGVudGlhbHMgPSBgJHtjbGllbnRJZH06JHtjbGllbnRTZWNyZXR9YDtcbiAgICAgIGNvbnN0IGVuY29kZWRDcmVkZW50aWFscyA9IGJ0b2EoY3JlZGVudGlhbHMpO1xuICAgICAgY29uc3QgYXV0aEhlYWRlciA9IGBCYXNpYyAke2VuY29kZWRDcmVkZW50aWFsc31gO1xuICAgICAgXG4gICAgICBjb25zdCB0b2tlblJlc3BvbnNlID0gYXdhaXQgaHVic3BvdC5mZXRjaChcImh0dHBzOi8vYXBpLmRvbW8uY29tL29hdXRoL3Rva2VuP2dyYW50X3R5cGU9Y2xpZW50X2NyZWRlbnRpYWxzJnNjb3BlPWRhdGElMjBhdWRpdCUyMHVzZXIlMjBkYXNoYm9hcmRcIiwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGF1dGhIZWFkZXIsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgaWYgKCF0b2tlblJlc3BvbnNlLm9rKSB7XG4gICAgICAgIGNvbnN0IGVycm9yQm9keSA9IGF3YWl0IHRva2VuUmVzcG9uc2UudGV4dCgpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvbW8gQXV0aCBFcnJvcjogJHt0b2tlblJlc3BvbnNlLnN0YXR1c30gLSAke2Vycm9yQm9keX1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdG9rZW5EYXRhID0gYXdhaXQgdG9rZW5SZXNwb25zZS5qc29uKCk7XG4gICAgICBjb25zdCBhY2Nlc3NUb2tlbiA9IHRva2VuRGF0YS5hY2Nlc3NfdG9rZW47XG5cbiAgICAgIGlmICghYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYWNjZXNzIHRva2VuIHJlY2VpdmVkIGZyb20gRG9tb1wiKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RlcCAyOiBHZXQgZW1iZWQgYXV0aGVudGljYXRpb24gdG9rZW4gd2l0aCBvcHRpb25hbCBmaWx0ZXJpbmdcbiAgICAgIGNvbnN0IGVtYmVkUGF5bG9hZCA9IHtcbiAgICAgICAgc2Vzc2lvbkxlbmd0aDogMTQ0MCxcbiAgICAgICAgYXV0aG9yaXphdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0b2tlbjogZW1iZWRJZCxcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiBbXCJSRUFEXCIsIFwiRklMVEVSXCIsIFwiRVhQT1JUXCJdLFxuICAgICAgICAgICAgZmlsdGVyczogY29tcGFueUlkID8gW3tcbiAgICAgICAgICAgICAgY29sdW1uOiBET01PX0ZJTFRFUl9DT05GSUcuZmlsdGVyQ29sdW1uLFxuICAgICAgICAgICAgICBvcGVyYXRvcjogRE9NT19GSUxURVJfQ09ORklHLmZpbHRlck9wZXJhdG9yLFxuICAgICAgICAgICAgICB2YWx1ZXM6IFtjb21wYW55SWRdXG4gICAgICAgICAgICB9XSA6IFtdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCBlbWJlZEVuZHBvaW50ID0gXCJodHRwczovL2FwaS5kb21vLmNvbS92MS9zdG9yaWVzL2VtYmVkL2F1dGhcIjtcblxuICAgICAgY29uc3QgZW1iZWRSZXNwb25zZSA9IGF3YWl0IGh1YnNwb3QuZmV0Y2goZW1iZWRFbmRwb2ludCwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBiZWFyZXIgJHthY2Nlc3NUb2tlbn1gLFxuICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBlbWJlZFBheWxvYWQsXG4gICAgICB9KTtcblxuICAgICAgaWYgKCFlbWJlZFJlc3BvbnNlLm9rKSB7XG4gICAgICAgIGNvbnN0IGVycm9yQm9keSA9IGF3YWl0IGVtYmVkUmVzcG9uc2UudGV4dCgpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvbW8gRW1iZWQgQXV0aCBFcnJvcjogJHtlbWJlZFJlc3BvbnNlLnN0YXR1c30gLSAke2Vycm9yQm9keX1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZW1iZWREYXRhID0gYXdhaXQgZW1iZWRSZXNwb25zZS5qc29uKCk7XG5cbiAgICAgIGlmICghZW1iZWREYXRhLmF1dGhlbnRpY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGF1dGhlbnRpY2F0aW9uIHRva2VuIGZvdW5kIGluIERvbW8gZW1iZWQgcmVzcG9uc2VcIik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRva2VuID0gZW1iZWREYXRhLmF1dGhlbnRpY2F0aW9uO1xuICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vcHVibGljLmRvbW8uY29tL2VtYmVkL3BhZ2VzLyR7ZW1iZWRJZH1gO1xuXG4gICAgICBzZXRFbWJlZFRva2VuKHRva2VuKTtcbiAgICAgIHNldEVtYmVkVXJsKHVybCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzZXRFcnJvcihcbiAgICAgICAgZXJyIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICA/IGVyci5tZXNzYWdlXG4gICAgICAgICAgOiBcIkZhaWxlZCB0byBsb2FkIERvbW8gZGFzaGJvYXJkLiBQbGVhc2UgY2hlY2sgeW91ciBzZXR0aW5ncy5cIlxuICAgICAgKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9LCBbY29tcGFueUlkXSk7IC8vIFJlLWZldGNoIGVtYmVkIHRva2VuIHdoZW4gY29tcGFueUlkIGNoYW5nZXNcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxvYWREb21vRW1iZWQoKTtcbiAgfSwgW2xvYWREb21vRW1iZWRdKTtcblxuICBpZiAobG9hZGluZykge1xuICAgIHJldHVybiAoXG4gICAgICA8RmxleCBkaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9XCJtZFwiIGFsaWduPVwiY2VudGVyXCI+XG4gICAgICAgIDxMb2FkaW5nU3Bpbm5lciBsYWJlbD1cIkxvYWRpbmcgRG9tbyBkYXNoYm9hcmQuLi5cIiAvPlxuICAgICAgPC9GbGV4PlxuICAgICk7XG4gIH1cblxuICBpZiAoZXJyb3IpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEFsZXJ0IHRpdGxlPVwiRXJyb3JcIiB2YXJpYW50PVwiZXJyb3JcIj5cbiAgICAgICAge2Vycm9yfVxuICAgICAgPC9BbGVydD5cbiAgICApO1xuICB9XG5cbiAgaWYgKCFlbWJlZFRva2VuIHx8ICFlbWJlZFVybCkge1xuICAgIHJldHVybiAoXG4gICAgICA8QWxlcnQgdGl0bGU9XCJFcnJvclwiIHZhcmlhbnQ9XCJlcnJvclwiPlxuICAgICAgICBObyBlbWJlZCBjb250ZW50IGF2YWlsYWJsZS4gUGxlYXNlIGNoZWNrIHlvdXIgc2V0dGluZ3MuXG4gICAgICA8L0FsZXJ0PlxuICAgICk7XG4gIH1cblxuICBjb25zdCBvcGVuRG9tb01vZGFsID0gKCkgPT4ge1xuICAgIC8vIENyZWF0ZSBIVE1MIHBhZ2UgdGhhdCBzdWJtaXRzIGZvcm0gdG8gRG9tbyB3aXRoIGVtYmVkIHRva2VuXG4gICAgY29uc3QgaHRtbCA9IGA8IURPQ1RZUEUgaHRtbD5cbjxodG1sPlxuPGhlYWQ+XG4gIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICA8dGl0bGU+RG9tbyBFbWJlZDwvdGl0bGU+XG4gIDxzdHlsZT5cbiAgICBib2R5IHsgbWFyZ2luOiAwOyBwYWRkaW5nOiAwOyBvdmVyZmxvdzogaGlkZGVuOyB9XG4gICAgI2RvbW8taWZyYW1lIHsgd2lkdGg6IDEwMHZ3OyBoZWlnaHQ6IDEwMHZoOyBib3JkZXI6IG5vbmU7IH1cbiAgPC9zdHlsZT5cbjwvaGVhZD5cbjxib2R5PlxuICA8aWZyYW1lIGlkPVwiZG9tby1pZnJhbWVcIiBuYW1lPVwiZG9tby1pZnJhbWVcIiBzcmM9XCJhYm91dDpibGFua1wiIHN0eWxlPVwid2lkdGg6IDEwMHZ3OyBoZWlnaHQ6IDEwMHZoOyBib3JkZXI6IG5vbmU7XCI+PC9pZnJhbWU+XG4gIDxzY3JpcHQ+XG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlmcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkb21vLWlmcmFtZScpO1xuICAgICAgaWYgKGlmcmFtZSkge1xuICAgICAgICB2YXIgZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICAgICAgZm9ybS5tZXRob2QgPSAnUE9TVCc7XG4gICAgICAgIGZvcm0uYWN0aW9uID0gJyR7ZW1iZWRVcmx9JztcbiAgICAgICAgZm9ybS50YXJnZXQgPSAnZG9tby1pZnJhbWUnO1xuICAgICAgICBmb3JtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGZvcm0uc2V0QXR0cmlidXRlKCdlbmN0eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xuICAgICAgICBcbiAgICAgICAgdmFyIHRva2VuRmllbGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICB0b2tlbkZpZWxkLnR5cGUgPSAnaGlkZGVuJztcbiAgICAgICAgdG9rZW5GaWVsZC5uYW1lID0gJ2VtYmVkVG9rZW4nO1xuICAgICAgICB0b2tlbkZpZWxkLnZhbHVlID0gJyR7ZW1iZWRUb2tlbi5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIil9JztcbiAgICAgICAgZm9ybS5hcHBlbmRDaGlsZCh0b2tlbkZpZWxkKTtcbiAgICAgICAgXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZm9ybSk7XG4gICAgICAgIGZvcm0uc3VibWl0KCk7XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChmb3JtICYmIGZvcm0ucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgZm9ybS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZvcm0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwMCk7XG4gICAgICB9XG4gICAgfSkoKTtcbiAgPC9zY3JpcHQ+XG48L2JvZHk+XG48L2h0bWw+YDtcblxuICAgIC8vIENyZWF0ZSBhIGRhdGEgVVJMIGZyb20gdGhlIEhUTUxcbiAgICBjb25zdCBkYXRhVXJsID0gYGRhdGE6dGV4dC9odG1sO2NoYXJzZXQ9dXRmLTgsJHtlbmNvZGVVUklDb21wb25lbnQoaHRtbCl9YDtcbiAgICBcbiAgICAvLyBPcGVuIHRoZSBpZnJhbWUgaW4gYSBtb2RhbFxuICAgIG9wZW5JZnJhbWVNb2RhbCh7XG4gICAgICB1cmk6IGRhdGFVcmwsXG4gICAgICB0aXRsZTogYCR7Y29tcGFueU5hbWV9YCxcbiAgICAgIHdpZHRoOiAxMjAwLFxuICAgICAgaGVpZ2h0OiA4MDAsXG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8RmxleCBkaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9XCJtZFwiPlxuICAgICAgPEJ1dHRvbiBvbkNsaWNrPXtvcGVuRG9tb01vZGFsfSB0eXBlPVwiYnV0dG9uXCI+XG4gICAgICAgIHtjb21wYW55TmFtZX0gMzYwIERhc2hib2FyZFxuICAgICAgPC9CdXR0b24+XG4gICAgPC9GbGV4PlxuICApO1xufTtcblxuIl0sIm5hbWVzIjpbInVpRXh0ZW5zaW9ucyIsIlJlYWN0IiwidXNlQ3JtUHJvcGVydGllcyIsInVzZVN0YXRlIiwidXNlQ2FsbGJhY2siLCJodWJzcG90IiwidXNlRWZmZWN0IiwiRmxleCIsIkxvYWRpbmdTcGlubmVyIiwiQWxlcnQiLCJCdXR0b24iXSwibWFwcGluZ3MiOiI7O0FBV0EsRUFBQUEsY0FBQSxRQUFRLE9BQXlCLENBQUMsRUFBRSxTQUFTLFFBQVEsTUFBTyxnQkFBQUMsT0FBQSxjQUFBLGVBQUEsRUFBYyxpQkFBaUIsUUFBUSxpQkFBaUIsUUFBQSxDQUFrQixDQUFFO0FBWXhJLFFBQU0sZ0JBQWdCLENBQUMsRUFBRSxpQkFBaUIsY0FBa0M7QUFFMUUsVUFBTSxxQkFBcUI7QUFBQSxNQUN6QixjQUFjO0FBQUE7QUFBQSxNQUNkLGdCQUFnQjtBQUFBLElBQUE7QUFJWixVQUFBLEVBQUUsV0FBZSxJQUFBQyxzQkFBaUIsQ0FBQyxRQUFRLFdBQVcsZ0JBQWdCLElBQUksQ0FBQztBQUNqRixVQUFNLENBQUMsWUFBWSxhQUFhLElBQUlDLGdCQUF3QixJQUFJO0FBQ2hFLFVBQU0sQ0FBQyxVQUFVLFdBQVcsSUFBSUEsZ0JBQXdCLElBQUk7QUFDNUQsVUFBTSxDQUFDLFNBQVMsVUFBVSxJQUFJQSxnQkFBUyxJQUFJO0FBQzNDLFVBQU0sQ0FBQyxPQUFPLFFBQVEsSUFBSUEsZ0JBQXdCLElBQUk7QUFHdEQsVUFBTSxlQUFjLHlDQUFZLFVBQ1oseUNBQVksYUFDWix5Q0FBWSxpQkFDWjtBQUdwQixVQUFNLFlBQVkseUNBQVk7QUFFeEIsVUFBQSxnQkFBZ0JDLE9BQUFBLFlBQVksWUFBWTtBQUN4QyxVQUFBO0FBQ0YsbUJBQVcsSUFBSTtBQUNmLGlCQUFTLElBQUk7QUFFYixnQkFBUSxJQUFJLFdBQVc7QUFFdkIsY0FBTSxXQUFXO0FBQ2pCLGNBQU0sZUFBZTtBQUNyQixjQUFNLFVBQVU7QUFFaEIsY0FBTSxjQUFjLEdBQUcsUUFBUSxJQUFJLFlBQVk7QUFDekMsY0FBQSxxQkFBcUIsS0FBSyxXQUFXO0FBQ3JDLGNBQUEsYUFBYSxTQUFTLGtCQUFrQjtBQUU5QyxjQUFNLGdCQUFnQixNQUFNQyxzQkFBUSxNQUFNLHdHQUF3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
