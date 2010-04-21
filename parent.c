#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

#include "parent.h"
#include "def.h"

static int nr_proc = 0;
static t_proc list [1024]; // Array, to keep the processes running in background

void parent (pid_t pid)
{
  int status;
  t_proc element;

  // Insert every new process into a array, to keep track
  element.proc_id = nr_proc;
  element.pid = pid;
  element.status = 0;
  
  // lollita
  list[nr_proc] = element;
  nr_proc++;
  
  waitpid(pid, &status, WUNTRACED);
  if (WIFSTOPPED(status)){
    // Child interrupted with ^Z
    printf("\nStopped: [%i]\n", list[nr_proc-1].proc_id);
  } else if (WIFSIGNALED(status)) {
    // Child killed
  } else if (WIFSTOPPED(status)) {
    // Child ended normally
  }  
}

void show_proc_list (void)
{
  int i = 0;

  for (;i < nr_proc; i++) {
    printf("[%i]\t\tpid:%i\t\t%i\n", list[i].proc_id, list[i].pid, list[i].status);
  }
}
