$SiteURL = 'sharepoint_url'
$DocumentLibraryName = "document_library"
$csv = Import-Csv "csv_llocation"

#Remove permission inheritance for the folders
$breakInheritance = $True

#Set the permission type for the folders
$permission = 'Contribute'

#Connect- to SPO site using credentials
Connect-PnPOnline -Url $SiteURL -Credential SPCred

######################################################################################
#Create a new document library
$root = New-PnPList -Title $DocumentLibraryName -Template DocumentLibrary -OnQuickLaunch
Write-Output "Created document libary $($DocumentLibraryName)"


#Break Permission Inheritance on the library if set to true
if($breakInheritance)
{
    Set-PnPList -Identity $DocumentLibraryName -BreakRoleInheritance -ClearSubscopes 
    Write-Output "Removed permission inheritance on document"
}

#create folders and apply permissions
foreach($val in $csv)
{
    #create the folder
    $folderName = $val.FolderName.replace(' ','')
    $stupid = Add-PnPFolder -Name $folderName -Folder $DocumentLibraryName
    Write-Output "`nCreated folder $($folderName) in document library $($DocumentLibraryName)"

    #splits any groups in the cell and performs a seperate operation on each
    $groups = $val.GroupName.replace(' ','')
    $groups = $groups.Split(";")
    foreach($group in $groups)
    {
        Set-PnPFolderPermission -List $DocumentLibraryName -Identity "$($DocumentLibraryName)\$($val.FolderName.replace(' ',''))" -User $group -AddRole $permission
        Write-Output "Set permission on $($folderName) for $($group)"
    }
}
Write-Output "`nComplete!"