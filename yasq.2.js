;(function($) {

// Internal methods
    // Generic error handler - can be overridden in config
    var _error = function(){
            if(window.console)
                if(console.error)
                    console.error('YASQ Error: '+errorMsg);
                else
                    console.log('YASQ error: '+errorMsg);
            else
                alert('YASQ error: '+errorMsg);//Need to up your browser game bro
    }

    var _hasMandatoryFields = function(o,fields,error){
        for(var i=0;i<fields.length;i++){
            var field = fields[i];

            if(!o[field]){
                error(field + ' is mandatory');

                return false;
            }
        }
        return true;
    }

    var _hasSoapError = function(xml,error){
        var $xml = $(xml);

        if($xml.find('faultcode').text() != ''){
            error('A SOAP error occured ('+$xml.find('errorcode').text()+'):'
                +'\n'+$xml.find('faultstring').text()
                +'\n'+$xml.find('errorstring').text()
            );

            return true;
        }

        return false;
    }

// Configuration
    var defaultOptions = {
        site: false, // mandatory here or when calling individual methods
        list: false, // mandatory here or when calling individual methods
        success: false,
        limit: 100,
        fields: ['Title'],
        recursive:false,// If dealing with a document library include subfolders
        query: '<OrderBy><FieldRef Name="ID" Ascending="TRUE" /></OrderBy>',
        error: function(errorMsg){//override for custom error handling
            _error(errorMsg);
        }
    };

// Public methods
    var methods = {
        init: function(options){
            defaultOptions = $.extend(defaultOptions,options);
        },
// List item methods
        getListItems: function(options){
            options = $.extend(defaultOptions,options);

            var mandatoryFields = ['site','list','success'];

            if(!_hasMandatoryFields(options,mandatoryFields,options.error)){
                return;
            }

			var viewFields = '';
			$.each(options.fields,function(i,d){
			    viewFields += '<FieldRef Name="'+d+'" />'
			});

			var query = '';
			if(options.query){
				query = '<query><Query>' + options.query + '</Query></query>';
			}

			queryOptions = '<queryOptions xmlns:SOAPSDK9="http://schemas.microsoft.com/sharepoint/soap/" ><QueryOptions>';

			if(options.recursive == true)
				queryOptions += '<ViewAttributes Scope="Recursive"/>';

			queryOptions += '</QueryOptions></queryOptions>';

			var soapXML =
				'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body> \
					 <GetListItems xmlns="http://schemas.microsoft.com/sharepoint/soap/"> \
						<listName>'+options.list+'</listName> \
						'+query+' \
						<viewFields> \
							<ViewFields> \
							   '+viewFields+' \
						   </ViewFields> \
						</viewFields> \
						<rowLimit>'+options.limit+'</rowLimit> \
						'+queryOptions+' \
					</GetListItems> \
				</soapenv:Body></soapenv:Envelope>';

            $.ajax({
                url: options.site+"_vti_bin/Lists.asmx",
                type: "POST",
                dataType: "xml",
                data: soapXML,
                contentType: 'text/xml; charset="utf-8"',
                beforeSend:function(xhr){
                    xhr.setRequestHeader("SOAPAction","http://schemas.microsoft.com/sharepoint/soap/GetListItems");
                },
                complete: function(xData, status){
                    if(_hasSoapError(xData.responseXML,options.error)){
                        return;
                    }

                    var results = [];

                    $(xData.responseXML).find("z\\:row").each(function(){
                        var tempResults = {};

                        $.each(this.attributes,function(i,attribute){
                            tempResults[attribute.name.substr(4).replace(/(_x0020_)/g,'')] = attribute.value;
                        });

                        results.push(tempResults);
                    });

                    options.success(results);
                }
            });
        },
        modListItems: function(options){
			options = $.extend(defaultOptions,options);

            var mandatoryFields = [
                'site',
                'list',
                'items'// {id:1,Title:'Test1'} or [{id:1,Title:'Test1'},{id:2,Title:'Test2'}]
            ];

            if(!_hasMandatoryFields(options,mandatoryFields,options.error)){
                return;
            }

			//Responsible for turning js object to xml string
			var createMethodString = function(item){
				if(item.id-0 != item.id){//verify set and a number, otherwise it'll SOAP error the whole thing anyway
					options.error('ModListItems: No id column specified.');
					return;
				}

				var operation = '';
				if(item.id == 0){
					operation = 'New';
				}
				else if(item.cmdModerate){
					operation = 'Moderate';
					delete item.cmdModerate;
				}
				else if(item.cmdDelete){
					operation = 'Delete';
					delete item.cmdDelete;
				}else{
					operation = 'Update';
				}

				var itemField = '<Method ID="'+item.id+'" Cmd="'+operation+'"> \
					<Field Name="ID">'+item.id+'</Field>';

				for(var property in item){
					if(property != 'id'){
						itemField += '<Field Name="'+property+'">'+item[property]+'</Field>';
					}
				}

				return itemField+'</Method>';
			}

			var itemFields = '';
			if(options.items.constructor == Array){
				for(var i=0;i<options.items.length;i++){
					itemFields += createMethodString(options.items[i]);
				}
			}else{
				itemFields = createMethodString(options.items);
			}

			var soapXML =
				'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body> \
					<UpdateListItems xmlns="http://schemas.microsoft.com/sharepoint/soap/"> \
						<listName>'+options.list+'</listName> \
						<updates> \
							<Batch OnError="Continue"> \
							'+itemFields+' \
							</Batch> \
						</updates> \
					</UpdateListItems> \
				</soapenv:Body></soapenv:Envelope>';

			$.ajax({
				url: options.site+"_vti_bin/Lists.asmx",
				type: "POST",
				dataType: "xml",
				data: soapXML,
				contentType: "text/xml; charset=\"utf-8\"",
				beforeSend:function(xhr){
				    xhr.setRequestHeader("SOAPAction","http://schemas.microsoft.com/sharepoint/soap/UpdateListItems");
				}
				complete: function(xData, status){
                    if(_hasSoapError(xData.responseXML,options.error)){
                        return;
                    }

					var results = [];
					$(xData.responseXML).find('Result').each(function(i,rowData){
						var errorCode = $(this).find('ErrorCode').text();
						if(errorCode == '0x00000000'){
							results[i] = {status: 'success'};

							$(this).find("z\\:row").each(function(){// <- should only be one, actually
								$.each(this.attributes,function(j,attribute){
									results[i][attribute.name.substr(4).replace(/(_x0020_)/g,'')] = attribute.value;
								});
							});
						}else{
							results[i] = {
								status: 'error',
								error: $(this).find('ErrorText').text(),
								errorCode: errorCode
							};
						}
					});

					options.success(results);
				}
			});
        },
		addListItems: function(options){
		    options = $.extend(defaultOptions,options);

            var mandatoryFields = [
                'site',
                'list',
                'items'// {Title:'Test'} or [{Title:'Test'},{Title:'Test'}]
            ];

            if(!_hasMandatoryFields(options,mandatoryFields,options.error)){
                return;
            }

            // id:0 = add as new item
			if(options.items.constructor == Array){
				for(var i=0;options.items[i];i++){
					options.items[i].id = 0;
				}
			}
			else{
				options.items.id = 0;
			}

			$.yasq('modListItems',options);
		},
		delListItems: function(options){
		    options = $.extend(defaultOptions,options);

            var mandatoryFields = [
                'site',
                'list',
                'items'// 3 or [3,24,25]
            ];

            if(!_hasMandatoryFields(options,mandatoryFields,options.error)){
                return;
            }

			var delCommands = [];
			if(options.items.constructor == Array){
				for(var i=0;options.items[i];i++){
					delCommands[i] = {id:options.items[i],cmdDelete:true};
				}
			}
			else{
				delCommands = {
					id:options.items,
					cmdDelete:true
				};
			}

			$.yasq('modListItems',options);
		},

// Manage approval status of items
		moderateListItems: function(options){
		    options = $.extend(defaultOptions,options);

            var mandatoryFields = [
                'site',
                'list',
                'items'//{id:1,status:'approved'} or [{id:1,status:'pending'},{id:2,status:'rejected'}]
            ];

            if(!_hasMandatoryFields(options,mandatoryFields,options.error)){
                return;
            }

			var getStatusNumber = function(str){
				// catch numbers - it's ugly but it's reliable across browsers & object types
				var strUpper = (''+str).toUpperCase();

				if(strUpper == 'APPROVED') return 0;
				if(strUpper == 'REJECTED') return 1;
				if(strUpper == 'PENDING') return 2;

				// Presume they know what they are doing...
				return str;
			};

			if(options.items.length){
				for(var i=0;i<options.items.length;i++){
					options.items[i].cmdModerate = true;
					options.items[i]._ModerationStatus = getStatusNumber(options.items[i].status);
					delete options.items[i]['status'];
				}
			}
			else{
				options.items.cmdModerate = true;
				options.items._ModerationStatus = getStatusNumber(options.items.status);
				delete options.items['status'];
			}

			$.yasq('modListItems',{
				site: options.site,
				list: options.list,
				items: options.items,
				success: options.success,
				error: options.error,
				debug:options.debug
			});

			return this;
		},

// Support queries
		getCurrentUserData: function(options){
			options = $.extend(defaultOptions,options);

			//force an update
			var urlString = options.site+'_layouts/userdisp.aspx?Force=True&'+new Date().getTime();

			$.ajax({
				url: urlString,
				complete: function (xData, Status){
					if(Status == 'error'){
						options.error('Unable to load user data.');
						return;
					}

					var userData = {};

					$(xData.responseText).find("table.ms-formtable td[id^='SPField']").each(function(){
						switch($(this).attr("id")) {
							case "SPFieldText":
								userData[$(this).prev().text()] = $(this).text();
								break;
							case "SPFieldNote":
								userData[$(this).prev().text()] = $(this).find("div").html();
								break;
							case "SPFieldURL":
								userData[$(this).prev().text()] = $(this).find("img").attr("src");
								break;
							default:
								userData[$(this).prev().text()] = $(this).text();
								break;
						}
					});

					var idSnippet = xData.responseText.substr(xData.responseText.indexOf('_spUserId=')+10,20);

					userData['id'] = idSnippet.substr(0,idSnippet.indexOf(';'));

					options.success(userData);
				}
			});
		},

// Search -- not finished
		search:function(options){
		    var extraOptions = $.extend(defaultOptions,{
                query:false,//String if text queryType, or mssqlft statement
                //end mandatory fields
                queryType:'text',//or 'sql'
                queryPacket:false,//specify your own querypacket
                scope:'All Content',//only used with text queryType
                startAt:1,
                resultCount:9
		    });

			options = $.extend(extraOptions,options);

			var mandatoryOptions = ['site','success'];

            if(!_hasMandatoryFields(options,mandatoryFields,options.error)){
                return;
            }

			if(options.queryPacket){
				var queryPacket = options.queryPacket;
			}
			else if(options.queryType == 'sql'){
				var queryPacket = '<QueryPacket xmlns="urn:Microsoft.Search.Query" Revision="1000"> \
						<Query domain="QDomain"> \
							<SupportedFormats> \
								<Format>urn:Microsoft.Search.Response.Document.Document</Format> \
							</SupportedFormats> \
							<Context> \
								<QueryText language="en-US" type="MSSQLFT"> \
									'+options.query+' \
								</QueryText> \
							</Context> \
						<SortByProperties><SortByProperty name="Rank" direction="Descending" order="1"/></SortByProperties> \
						<Range><StartAt>'+options.startAt+'</StartAt><Count>'+options.resultCount+'</Count></Range> \
						</Query> \
					</QueryPacket>';
			}
			else{
				if(!options.query) options.error('Search: No query defined');

				var queryPacket = '<QueryPacket xmlns="urn:Microsoft.Search.Query" Revision="1000"> \
					<Query domain="QDomain"> \
						<SupportedFormats> \
							<Format>urn:Microsoft.Search.Response.Document.Document</Format> \
						</SupportedFormats> \
						<Context> \
							<QueryText language="en-US" type="STRING">SCOPE:"'+options.scope+'"'+options.query+'</QueryText> \
						</Context> \
						<SortByProperties><SortByProperty name="Rank" direction="Descending" order="1"/></SortByProperties> \
						<Range><StartAt>'+options.startAt+'</StartAt><Count>'+options.resultCount+'</Count></Range> \
					</Query> \
				</QueryPacket>';
			}

			/* extra options to implement
        var queryXML =
            "<QueryPacket xmlns='urn:Microsoft.Search.Query' Revision='1000'> \
            <Query domain='QDomain'> \
             <SupportedFormats><Format>urn:Microsoft.Search.Response.Document.Document</Format></SupportedFormats> \
             <Context> \
              <QueryText language='en-US' type='STRING' >SCOPE:\"" + quickSearchConfig.scope + "\"" + query + "</QueryText> \
             </Context> \
             \
             <Range><StartAt>1</StartAt><Count>" + quickSearchConfig.numberOfResults + "</Count></Range> \
             <EnableStemming>false</EnableStemming> \
             <TrimDuplicates>true</TrimDuplicates> \
             <IgnoreAllNoiseQuery>true</IgnoreAllNoiseQuery> \
             <ImplicitAndBehavior>true</ImplicitAndBehavior> \
             <IncludeRelevanceResults>true</IncludeRelevanceResults> \
             <IncludeSpecialTermResults>true</IncludeSpecialTermResults> \
             <IncludeHighConfidenceResults>true</IncludeHighConfidenceResults> \
            </Query></QueryPacket>";
				*/

			var soapXML = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"> \
				<soap:Body> \
					<Query xmlns="urn:Microsoft.Search"> \
						<queryXml> \
							'+queryPacket.replace(/</g,'&lt;').replace(/>/g,'&gt;')+' \
						</queryXml> \
					</Query> \
				</soap:Body> \
			</soap:Envelope>';

			$.ajax({
				url: options.site+"_vti_bin/Search.asmx",
				type: "POST",
				dataType: "xml",
				data: soapXML,
				complete: function(xData, status){
                    if(_hasSoapError(xData.responseXML,options.error)){
                        return;
                    }

					var results = [];

					if(options.queryType == 'text'){
						$(xData.responseXML).find("QueryResult").each(function(){
							var tempXML = $("<xml>" + $(this).text() + "</xml>");
							tempXML.find("Document").each(function(i,d){
								results[i] = {
									title:$("Title", $(this)).text(),
									url:$("Action>LinkUrl", $(this)).text(),
									description:$("Description", $(this)).text(),
									date:$("Date", $(this)).text(),
									relevance:$(this).attr('relevance')
								};
							});
						});
					}else{//sql
						$(xData.responseXML).find('QueryResult').each(function(){
							var tempXML = $('<xml>'+$(this).text()+'</xml>');
							tempXML.find('Document').each(function(i,d){
								results[i] = {};

								$(this).find('Property').each(function(){
									var property = $(this).find('Name').text().toLowerCase();
									results[i][property] = $(this).find('Value').text();
								});
							});
						});
					}

					if(results.length < 1){
						options.success(false,status);
					}else{
						options.success(results,status);
					}
				},
				contentType: "text/xml; charset=\"utf-8\""
			});

			return this;
		},

// Get the schema for a list -- not finished
		getListSchema:function(options){
            var extraOptions = $.extend(defaultOptions,{
				view:false,
            });

            options = $.extend(extraOptions,options);

            var mandatoryFields = ['site','list','success'];

            if(!_hasMandatoryFields(options,mandatoryFields,options.error)){
                return;
            }

			var soapXML =
				'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body> \
					<GetListAndView xmlns="http://schemas.microsoft.com/sharepoint/soap/"> \
						<listName>'+options.list+'</listName> \
						'+(options.view?('<viewName>'+options.view+'</viewName>'):'')+' \
					</GetListAndView> \
				</soapenv:Body></soapenv:Envelope>';

			$.ajax({
				error:function(a,b,c,d,e,f,g){
					$.yasq('debug',[a,b,c,d,e,f,g]);
				},
				url: options.site+"_vti_bin/Lists.asmx",
				type: "POST",
				dataType: "xml",
				data: soapXML,
				complete: function(xData, status){
                    if(_hasSoapError(xData.responseXML,options.error)){
                        return;
                    }

					var listFields = {};
					$(xData.responseXML).find('Fields > Field').each(function(i,e){
						var newField = {};

						if(($(e).attr('Hidden') == 'TRUE' && $(e).attr('Type') != 'ModStat') || $(e).attr('Type') == 'Computed'){
							return;
						}

						//Determine field type
						if($(e).attr('PrimaryKey') == 'TRUE') 	newField.type = 'ID';
														 else	newField.type = $(e).attr('Type');

						//on all fields
						newField.internalName = $(e).attr('StaticName');
						newField.displayName = $(e).attr('DisplayName');
						newField.readOnly = ($(e).attr('ReadOnly')=='TRUE');
						newField.required = ($(e).attr('Required')=='TRUE');

						if($(e).attr('Description')) newField.description = $(e).attr('Description');

						if($(e).find('Default').length)	newField.defaultValue = $(e).find('Default').text();

						//specific types
						if(newField.type == 'Text'){
							newField.max = $(e).attr('MaxLength');
						}
						else if(newField.type == 'Number' || newField.type == 'Currency'){
							if($(e).attr('Min')) newField.min = $(e).attr('Min');
							if($(e).attr('Max')) newField.max = $(e).attr('Max');
							if($(e).attr('Percentage') == 'TRUE') newField.showAsPercentage = true;
							if($(e).attr('Decimals')) newField.decimalPlaces = $(e).attr('Decimals');//<-wont exist under Currency
						}
						else if(newField.type == 'Note'){
							newField.richText = $(e).attr('RichText');
							newField.allowHyperlinks = $(e).attr('AllowHyperlink');
							newField.richTextMode = $(e).attr('RichTextMode');
						}
						else if(newField.type == 'Choice'){
							newField.format = $(e).attr('Format');
							newField.allowFillInChoices = ($(e).attr('FillInChoice') == 'TRUE');

							newField.choices = [];
							$(this).find('CHOICE').each(function(i,choice){
								newField.choices[i] = $(this).text();
							});
						}
						else if(newField.type == 'DateTime'){
							newField.dateOnly = ($(e).attr('Format')=='DateOnly');
						}
						else if(newField.type == 'URL'){
							newField.format = $(e).attr('Format');
						}
						else if(newField.type == 'Calculated'){
							newField.format = $(e).attr('Format');

							newField.formula = $(e).find('Formula').text();
							newField.formulaDisplayNames = $(e).find('FormulaDisplayNames').text();

							newField.resultType = $(e).attr('ResultType');
							if($(e).attr('Decimals')) newField.decimals = $(e).attr('Decimals');
						}
						else if(newField.type == 'User' || newField.type == 'UserMulti'){
							if($(e).attr('UserSelectionMode')) newField.userSelectionMode = $(e).attr('UserSelectionMode');
							if($(e).attr('UserSelectionScope')) newField.userSelectionScope = $(e).attr('UserSelectionScope');
							if($(e).attr('List')) newField.list = $(e).attr('List');
							if($(e).attr('ShowField')) newField.showField = $(e).attr('ShowField');
							if(newField.type == 'UserMulti') newField.multiple = true;
						}
						else if(newField.type == 'Lookup' || newField.type == 'LookupMulti'){
							if($(e).attr('List')) newField.list = $(e).attr('List');
							if($(e).attr('ShowField')) newField.showField = $(e).attr('ShowField');
							if(newField.type == 'LookupMulti') newField.multiple = true;
						}
						else if(newField.type == 'Attachments'){
							newField.readOnly = true;
						}

						listFields[$(this).attr('StaticName')] = newField;
					});

					if(options.debug){
						var tempTable = '';
						for(field in listFields){
							tempTable += '<table style="text-align:left;" border=1>';

							tempTable +='<tr><td><strong>'+field+'</strong></td><td>&nbsp;</td></tr>';

							for(property in listFields[field]){
								tempTable += '<tr><td>'+property+'</td><td>'+listFields[field][property]+'</td></tr>';
							}

							tempTable+'</table>'
						}
						options.debug(tempTable);
					}

					//Package the info
					var listSchema = {
						site:options.site,
						list:options.list,
						listGuid:$(xData.responseXML).find('List').attr('ID'),
						listUrl:$(xData.responseXML).find('List').attr('DefaultViewUrl'),
						fields:listFields
					};

					options.success(listSchema);
				},
				contentType: "text/xml; charset=\"utf-8\"",
				beforeSend:function(xhr){xhr.setRequestHeader("SOAPAction","http://schemas.microsoft.com/sharepoint/soap/GetListAndView");}
			});

			return this;
		},

// Data helper methods
		//Takes a date object and returns an SP formatted date string current; default = now
		getSPDate: function(d){
			if(!d){
				d = new Date();
			}

			return d.getUTCFullYear()
				+'-'+(d.getUTCMonth()<9?'0'+(d.getUTCMonth()+1):(d.getUTCMonth()+1))
				+'-'+(d.getUTCDate()<10?'0'+(d.getUTCDate()):(d.getUTCDate()))
				+'T'+(d.getUTCHours()<9?'0'+(d.getUTCHours()+1):(d.getUTCHours()+1))
				+':'+(d.getUTCMinutes()<9?'0'+(d.getUTCMinutes()+1):(d.getUTCMinutes()+1))
				+':'+(d.getUTCSeconds()<9?'0'+(d.getUTCSeconds()+1):(d.getUTCSeconds()+1))
				+'Z';
		},

		//creates a date object from a sharepoint date/time string
		getJSDate: function(sds){
			return new Date(
				sds.substr(0,4),//yyyy
				sds.substr(5,2)-1,//mm
				sds.substr(8,2),//dd
				sds.substr(11,2),//hh
				sds.substr(14,2),//mm
				sds.substr(17,2)//ss
			);
		},

		// Basic escaping for html-enabled fields
		htmlEscape: function(str) {
			return String(str)
				.replace(/&/g, '&amp;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		},

		// Basic unescaping for html-enabled fields
		htmlUnescape: function(str) {
			return String(str)
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, '\'')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&amp;/g, '&');
		},

		//Converts a FileRef column to it's image URL
		//optionally you can specify 'thumb', or 'wide' to get those respective versions
		frToImage:function(fileref,size){
			fileref = fileref.substr(fileref.indexOf(';#')+2);

			if(!size) return '/'+fileref;

			if(size == 'thumb') var sizeFolder = '/_t';
			else var sizeFolder = '/_w';

			var lastSlash = fileref.lastIndexOf('/');
			fileref = fileref.substr(0,lastSlash) + sizeFolder + fileref.substr(lastSlash);

			var extension = fileref.substr(fileref.lastIndexOf('.'));
			var thumbExtension = '_' + extension.substr(1) + extension;

			return '/'+fileref.substr(0,fileref.lastIndexOf('.')) + thumbExtension;
		},

		//Finds the folder tree a FileRef is located in, given the libraries name
		frToFolder:function(FileRef,spLibraryName){
			FileRef = FileRef.substr(FileRef.indexOf(spLibraryName)+spLibraryName.length+1);

			return FileRef.substr(0,FileRef.lastIndexOf('/'));
		},
    };

	$.yasq = function(method){
		if (methods[method]){
			return methods[ method ].apply(this,Array.prototype.slice.call(arguments,1));
		}else if( typeof method === 'object' || ! method ) {
			return methods.init.apply(this,arguments);
		} else {
			$.error( 'Invalid YASQ method: ' +  method);
		}
	};
})(jQuery);