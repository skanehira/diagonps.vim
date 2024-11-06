import { Denops } from "jsr:@denops/std@7.3.0";
import * as fn from "jsr:@denops/std@7.3.0/function";
import * as buffer from "jsr:@denops/std@7.3.0/buffer";
import * as option from "jsr:@denops/std@7.3.0/option";
import * as mapping from "jsr:@denops/std@7.3.0/mapping";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import { is } from "jsr:@core/unknownutil@4.3.0";
import Diagon from "npm:diagonjs";

export async function main(denops: Denops): Promise<void> {
  const diagon = await Diagon.init();

  const translators = [
    "math",
    "sequence",
    "tree",
    "table",
    "grammar",
    "frame",
    "graphDAG",
  ] as const;

  const isTranslator = is.LiteralOneOf(translators);
  const previewBufName = "__DiagonOutput__";

  await denops.cmd(
    `command! -nargs=1 -complete=customlist,diagonps#translators Diagonps call denops#notify("${denops.name}", "translator", [<f-args>])`,
  );

  const openPreviewBuffer = async (denops: Denops): Promise<void> => {
    if (!await fn.bufexists(denops, previewBufName)) {
      const { bufnr } = await buffer.open(denops, previewBufName, {
        opener: "new",
      });
      await batch.batch(denops, async (denops) => {
        await option.buftype.setBuffer(denops, bufnr, "nofile");
        await option.swapfile.setBuffer(denops, bufnr, false);
        await option.bufhidden.setBuffer(denops, bufnr, "wipe");
        await option.wrap.setLocal(denops, false);
        await option.cursorline.setLocal(denops, false);
      });
    } else {
      const winid = await fn.bufwinid(denops, previewBufName);
      if (winid !== -1) {
        await fn.win_gotoid(denops, winid);
      } else {
        await denops.cmd(`sb ${previewBufName}`);
      }
    }
  };

  denops.dispatcher = {
    async translator(translator: unknown): Promise<void> {
      if (!isTranslator(translator)) {
        console.error(`Invalid translator: ${translator}`);
        return;
      }

      const content = await fn.getbufline(denops, "%", 1, "$");
      const output = diagon.translate[translator](content.join("\n"));

      const oldwinid = await fn.bufwinid(denops, "%");
      await openPreviewBuffer(denops);

      await mapping.map(denops, "q", "<Cmd>bw<CR>", {
        mode: ["n"],
        buffer: true,
        silent: true,
        noremap: true,
      });
      await fn.deletebufline(denops, previewBufName, 1, "$");
      await fn.setbufline(denops, "%", 1, output.split("\n"));

      await fn.win_gotoid(denops, oldwinid);
    },
  };
}
