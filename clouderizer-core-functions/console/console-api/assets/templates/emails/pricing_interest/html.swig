<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta name="viewport" content="width=device-width" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css">
<title> {{ domainName }}: New Registration</title>
</head>

<body itemscope itemtype="http://schema.org/EmailMessage">
<h2 style="text-align:center;">
<i class="fa fa-cloud" style="font-size:40px; font-family:'FontAwesome';"></i> Clouderizer
</h2>
<table class="body-wrap">
  <tr>
    <td></td>
    <td class="container">
      <div class="content">
        <table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope itemtype="http://schema.org/ConfirmAction">
          <tr>
            <td class="content-wrap">
              <meta itemprop="name" content="New Registration"/>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="content-block">
                    Following customer has expressed interest in Clouderizer pricing.
                  </td>
                </tr>
                <tr>
                  <td class="content-block">
                    Company : {{customer.name}}
                  </td>
                </tr>
                <tr>
                  <td class="content-block">
                    Customer ID : {{customer.id}}
                  </td>
                </tr>
                <tr>
                  <td class="content-block">
                    Phone : {{customer.phone}}
                  </td>
                </tr>
                <tr>
                  <td class="content-block">
                    Country : {{customer.country}}
                  </td>
                </tr>
                <tr>
                  <td class="content-block">
                    Organisation Type : {{customer.organisation_type}}
                  </td>
                </tr>
                <tr>
                  <td class="content-block">
                    Email : {{user.email}}
                  </td>
                </tr>
                <tr>
                  <td class="content-block">
                    User : {{user.name}}
                  </td>
                </tr>
               
                <tr>
                  <td class="content-block">
                    <a href="{{ url }}">&mdash; Team Clouderizer</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div class="footer">
          <table width="100%">
            
          </table>
        </div></div>
    </td>
    <td></td>
  </tr>
</table>

</body>
</html>