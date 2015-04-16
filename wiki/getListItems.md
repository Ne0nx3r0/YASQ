## Copy & Paste Example ##
```
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script> 
<script type="text/javascript" src="http://yasq.googlecode.com/files/yasq.js"></script> 
<script>
$.yasq('getListItems',{
	site:'http://yoursite/your/page/',
	list:'Announcements',
	fields: ['Title'],
	limit:10,
	//recursive:true,
	cache:300,//five minutes
	query:'<OrderBy><FieldRef Name="ID" Ascending="TRUE" /></OrderBy>',
	success:function(results){
		var appendHTML = '';
		$.each(results,function(i,result){
			appendHTML += '<hr>';
			$.each(result,function(name,property){
				appendHTML += name + '=>' + property + '<br>';
			});
		});
		
		$('body').append(appendHTML);
	}
});
</script>
```

# Required #


---


### site ###
Default: <font color='#666666'><i>No default value</i></font>

Example:
```
site:'http://yoursite/your_page/',
```


---


## list ##
Default: <font color='#666666'><i>No default value</i></font>

Example 1:
```
	list:'Announcements',
```
Example 2:
```
	list:'{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}',
```

---


## fields ##
Default: <font color='#666666'><i>No default value</i></font>

Example 1:
```
	fields: ['Title','MyCustomField'],
```

---


## success ##
Default: <font color='#666666'><i>No default value</i></font>

Description: <font color='#666666'><i>Called on success, contains information about the individual items success/failure, and IDs.</i></font>

Example:
```
	success:function(results){
		var appendHTML = '';
		$.each(results,function(i,result){
			appendHTML += '<hr>';
			$.each(result,function(name,property){
				appendHTML += name + '=>' + property + '<br>';
			});
		});
		$('body').append(appendHTML);
	},
```

# Optional #


---


## query ##
Default: <font color='#666666'><i><code>&lt;OrderBy&gt;&lt;FieldRef Name="ID" Ascending="TRUE" /&gt;&lt;/OrderBy&gt;</code></i></font>

Description: <font color='#666666'><i>SharePoint SOAP Query to use when looking up items.</i></font>

Example:
```
		query:'<OrderBy><FieldRef Name="ID" Ascending="TRUE" /></OrderBy>',
```


---


## error ##
Default: <font color='#666666'><i>No default value</i></font>

Description: <font color='#666666'><i>Called only on errors that prevent the action from taking place (eg SOAP errors). Errors on individual items are handled in the success handler.</i></font>

Example:
```
	error:function(errorMsg){
		alert('The default error message handler just alerts the error, '
		+'this handler is called only when something that has prevented the '
		+'operation from occuring (eg. a SOAP error) has occured.\n'+errorMsg);
	}
```


---


## limit ##
Default: <font color='#666666'><i>100</i></font>

Description: <font color='#666666'><i>Maximum number of items to return</i></font>

Example:
```
	limit:50,
```


---


## cache ##
Default: <font color='#666666'><i>false</i></font>

Description: <font color='#666666'><i>Number of seconds to cache the result for. Uses localstorage, if available, otherwise doesn`'t cache.</i></font>

Example:
```
    cache:300,//five minutes
```


---


## recursive ##
Default: <font color='#666666'><i>false</i></font>

Description: <font color='#666666'><i>If true and the list is a document library the query will search through folders</i></font>

Example:
```
	recursive:true,
```


---
