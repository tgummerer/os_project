#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

#include "parent.h"

void parent (pid_t pid)
{
  int status;
  waitpid(pid, &status, WUNTRACED);
  if (WIFSTOPPED(status)){
    printf("Child interruptet temporarily");
  }
  
}
