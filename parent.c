#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

#include "parent.h"

void parent (pid_t pid)
{
  int sval;
  
  wait(&sval);
  if (WIFEXITED(sval) && WEXITSTATUS(sval) == 0) {
    fprintf(stderr, "Child %d terminated normally, status: %d\n", pid, WEXITSTATUS(sval));
  } else {
    fprintf(stderr, "Child %d died abnormally\n", pid);
  }
  
}
