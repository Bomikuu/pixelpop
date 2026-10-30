import { Component, createRef } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

const loadedDialogs = new WeakMap();

export default class DeferredDashboardDialog extends Component {
  state = { View: loadedDialogs.get(this.props.load) || null, failed: false };
  active = false;
  closing = false;
  sequence = 0;
  closeButton = createRef();

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidMount() {
    this.active = true;
    if (!this.state.View) this.load();
  }

  componentWillUnmount() {
    this.active = false;
    this.sequence += 1;
  }

  load = async () => {
    const operation = ++this.sequence;
    try {
      const module = await this.props.load();
      if (!this.active || operation !== this.sequence) return;
      loadedDialogs.set(this.props.load, module.default);
      this.setState({ View: module.default, failed: false });
    } catch {
      if (this.active && operation === this.sequence) this.setState({ failed: true });
    }
  };

  retry = () => {
    this.closeButton.current?.focus();
    loadedDialogs.delete(this.props.load);
    this.setState({ View: null, failed: false });
    this.load();
  };

  close = () => {
    this.closing = true;
    this.props.onClose();
  };

  render() {
    const { View, failed } = this.state;
    if (View && !failed) return <View {...this.props.dialogProps} />;

    return <Dialog open onOpenChange={(open) => { if (!open) this.close(); }}>
      <DialogContent className="personal-dashboard sm:max-w-md [&_[data-slot=dialog-close]]:grid [&_[data-slot=dialog-close]]:size-11 [&_[data-slot=dialog-close]]:place-items-center" onCloseAutoFocus={(event) => {
        // Loading completion hands focus to the real dialog, rather than its launcher.
        if (!this.closing) event.preventDefault();
        else this.props.restoreFocus?.(event);
      }}>
        <DialogHeader className="pr-12 text-left">
          <DialogTitle>{this.props.title}</DialogTitle>
          <DialogDescription>{this.props.description}</DialogDescription>
        </DialogHeader>
        {failed ? <div className="space-y-2">
          <p role="alert" className="text-sm text-red-800">This dialog is unavailable. Retry or close it. If the problem continues, reload the workspace.</p>
          <Button type="button" variant="link" className="px-0" onClick={() => window.location.reload()}>Reload workspace</Button>
        </div> : <p role="status" className="flex items-center gap-2 py-3 text-sm text-slate-600"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />Opening dialog…</p>}
        <DialogFooter>
          <Button ref={this.closeButton} type="button" variant="outline" onClick={this.close}>Close</Button>
          {failed && <Button type="button" onClick={this.retry}><RefreshCw className="size-4" aria-hidden="true" />Retry</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>;
  }
}
