#include <signal.h>
#include <stdlib.h>
#include <stdio.h>

#include "sighandlers.h"

void sighandlers(void)
{
  if (signal(SIGINT, sigint_handler) == SIG_ERR) {
    perror("signal");
    exit(1);
  }
}

void sigint_handler (int sig)
{
  signal(SIGINT, sigint_handler);
  printf("Foreground process killed\n");
}

void sigstop_handler (int sig)
{
  signal(SIGSTOP, sigstop_handler);
  printf("Interrupt process temporarily\n");
}
