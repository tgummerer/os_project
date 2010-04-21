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
    // Child exited normally
  } else {
    // Child exited abnormally
  }
  
}
