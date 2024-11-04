let s:translators = ["math", "sequence", "tree", "table", "grammar", "frame", "graphDAG"]

function! diagonps#translators(argLead, l, p) abort
  if a:argLead == ""
    return s:translators
  endif
  return filter(s:translators, { _, v -> v =~# printf(".*%s.*", a:argLead)})
endfunction

