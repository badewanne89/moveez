{{/* vim: set filetype=mustache: */}}
{{/*
Replace underscores for DNS compatibility.
*/}}
{{- define "branchName" -}}
{{- .Values.branchName | replace "_" "-" -}}
{{- end -}}
