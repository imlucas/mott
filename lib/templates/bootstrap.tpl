onBootstrap({
    'js': {
         'src': '{{JSURL}}',
         'version': '{{JSVersion}}'
    },
    'css': {
          'src': '{{CSSURL}}',
          'version': '{{CSSVersion}}'
    },
    'version': '3.0.0',
    'versionCode': 3030,
    'updateRequired': false,
    'env': '{{env}}'
    {{# if socketio}}
    ,'socketio': '{{socketio}}'
    {{/if}}
    {{# if weinre}}
    , 'weinre': 'http://debug.phonegap.com/target/target-script-min.js#{{weinre}}'
    {{/if}}
});