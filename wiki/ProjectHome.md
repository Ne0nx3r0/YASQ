# YASQ #
A jQuery plugin to make short & sweet queries to the [SharePoint](http://sharepoint.microsoft.com/en-us/Pages/default.aspx) [SOAP services API](http://msdn.microsoft.com/en-us/library/ms479390(v=office.12).aspx) in JavaScript.

## Included ##
The following functions are (so far) included to manage SharePoint Lists:
  * [getListItems](getListItems.md)
  * [modListItems](modListItems.md)
  * [addListItems](addListItems.md)
  * [delListItems](delListItems.md)
  * [getCurrentUserData](getCurrentUserData.md)

## Usage ##

Basic copy and paste example:
```
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>
<script src="http://yasq.googlecode.com/files/yasq.js"></script>
<script>
$.yasq('getListItems',{
	site:'http://yoursite/yourpage/',
	list:'Announcements',
	fields:['LinkTitle'],
	success:function(results){
		if(!results){
			$('body').append('no results found, sorry!');	
		}
		else{
			for(var i=0;i<results.length;i++){
				for(property in results[i]) $('body').append(property + ' => '+results[i][property]+'<br>');
				$('body').append('<hr>');
			}
		}
	}
});
</script>
```

Example using all options for getItem:
```
<script>
$.yasq('getListItems',{
	site:'http://yoursite/yourpage/',
	list:'Announcements',
	fields:['LinkTitle'],
	limit:4,
        recursive:true,
        cache:300,
	query:'<OrderBy><FieldRef Name="ID" Ascending="TRUE" /></OrderBy>',
	success:function(results){
		if(!results){
			$('body').append('no results found, sorry!');	
		}
		else{
			for(var i=0;i<results.length;i++){
				for(property in results[i]) $('body').append(property + ' => '+results[i][property]+'<br>');
				$('body').append('<hr>');
			}
		}
	},
	error:function(errorMsg){
		alert('Custom error handler received this message: \n\n'+errorMsg);	
	}
});
</script>
```