{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "branchName" -}}
{{- .Values.branchName | replace "_" "-" -}}
{{- end -}}
