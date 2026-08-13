import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type StatsModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  testId: string;
  children: React.ReactNode;
};

function StatsModal({ open, setOpen, title, testId, children }: StatsModalProps) {
  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" mmux-testid={testId}>
      <DialogTitle>
        {title}
        <IconButton aria-label="close" onClick={() => setOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}

export default StatsModal;
