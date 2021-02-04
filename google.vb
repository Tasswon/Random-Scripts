Imports System
Imports System.IO
Imports System.Net
Imports System.Web
Imports System.Linq
Imports System.Text
Imports System.Xml
Imports System.Drawing


Public Class GeoUtil
    Public Shared Function GeocodeAddress(ByVal address As String, ByVal city As String, ByVal province As String, ByVal countryCode As String, ByVal postalCode As String, ByVal googleApiKey As String, ByRef Errormessage As String) As Location
        Dim location As New Location(0, 0)
        Try
            Dim addressString As String = String.Format("{0}, {1}, {2}, {3}, {4}", address, city, province, countryCode, postalCode)
            Dim url As String = String.Format("https://maps.googleapis.com/maps/api/geocode/xml?address={0}&key={1}&components=country:{2}", Uri.EscapeDataString(addressString), googleApiKey, countryCode)

            Dim request As WebRequest = WebRequest.Create(url)
            Dim response As WebResponse = request.GetResponse()

            Dim xDoc As XDocument = XDocument.Load(response.GetResponseStream())
            Dim statusCode = CStr(xDoc.Element("GeocodeResponse").Element("status"))
            Dim errorReport = CStr(xDoc.Element("GeocodeResponse").Element("error_message"))

            'Returns either a status code indicating an issue with API processing or the result
            Select Case statusCode
                Case "UNKNOWN_ERROR", "ZERO_RESULTS", "OVER_DAILY_LIMIT", "OVER_QUERY_LIMIT", "REQUEST_DENIED", "INVALID_REQUEST"
                    Errormessage = $"{statusCode} - {errorReport}"
                Case Else
                    Dim result = xDoc.Element("GeocodeResponse").Element("result")
                    Dim locationElement = result.Element("geometry").Element("location")
                    Dim latitude = locationElement.Element("lat")
                    Dim longitude = locationElement.Element("lng")

                    location.Latitude = latitude
                    location.Longitude = longitude

                    Errormessage = ""
            End Select

        Catch ex As Exception
            Errormessage = "UNKNOWN ERROR"
        End Try

        Return location
    End Function

    'Returns the address given a set of coordinates
    Public Shared Function ReverseGeocodeAddress(ByVal latitude As String, ByVal longitude As String, ByVal googleApiKey As String, ByRef Errormessage As String) As ReverseLocation
        Dim reverseLocation As New ReverseLocation("", "", "", "", "")
        Try
            Dim addressString As String = String.Format("{0}, {1}", latitude, longitude)
            Dim url As String = String.Format("https://maps.googleapis.com/maps/api/geocode/xml?latlng={0}&key={1}", Uri.EscapeDataString(addressString), googleApiKey)

            Dim request As WebRequest = WebRequest.Create(url)
            Dim response As WebResponse = request.GetResponse()

            Dim xDoc As XDocument = XDocument.Load(response.GetResponseStream())
            Dim statusCode = CStr(xDoc.Element("GeocodeResponse").Element("status"))
            Dim errorReport = CStr(xDoc.Element("GeocodeResponse").Element("error_message"))

            'Returns either a status code indicating an issue with API processing or the result
            Select Case statusCode
                Case "UNKNOWN_ERROR", "ZERO_RESULTS", "OVER_DAILY_LIMIT", "OVER_QUERY_LIMIT", "REQUEST_DENIED", "INVALID_REQUEST"
                    Errormessage = $"{statusCode} - {errorReport}"
                Case Else
                    Dim result As IEnumerable(Of XElement) = xDoc.Element("GeocodeResponse").Element("result").Descendants("address_component")
                    reverseLocation = FormatAddress(result, reverseLocation)
                    Errormessage = ""
            End Select

        Catch ex As Exception
            Errormessage = "UNKNOWN_ERROR"
        End Try

        Return reverseLocation
    End Function
End Class


Public Class Location
    Public Property Latitude As Double
    Public Property Longitude As Double

    Public Sub New(ByVal lat As Double, ByVal lng As Double)
        Latitude = lat
        Longitude = lng
    End Sub
End Class

Public Class ReverseLocation
    Public Property Street As String
    Public Property City As String
    Public Property Province As String
    Public Property Country As String
    Public Property PostalCode As String

    Public Sub New(ByVal s As String, ByVal c As String, ByVal pr As String, ByVal ct As String, ByVal pc As String)
        Street = s
        City = c
        Province = pr
        Country = ct
        PostalCode = pc
    End Sub
End Class

Module Program
    Sub Main(args As String())
        Dim errorMessage As String
        Dim test As ReverseLocation

        errorMessage = ""
        'test = GeoUtil.ReverseGeocodeAddress(0, 0, "", errorMessage)
    End Sub
End Module
