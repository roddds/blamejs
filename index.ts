/**
 * BlameJS is a JavaScript parser for inflating a data object from the
 * output of a git blame -p (for porcelain) operation
 *
 * For more information on the structure of the porcelain format, see
 * http://www.kernel.org/pub/software/scm/git/docs/git-blame.html
 *
 * Based on 'GitBlameParserJS' by Matt Pardee
 * https://github.com/mattpardee/GitBlameParserJS
 *
 * @author Muhammed Thanish
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
interface CommitData {
  author: string;
  authorMail: string;
  authorTime: string;
  authorTz: string;
  committer: string;
  committerMail: string;
  committerTime: string;
  committerTz: string;
  summary: string;
  previousHash: string;
  filename: string;
}

interface LineData {
  code: string;
  hash: string;
  originalLine: string;
  finalLine: string;
  numLines: string;
}

class BlameJS {
  private commit_data: { [key: string]: CommitData };
  private line_data: { [key: string]: LineData };
  private settingCommitData: boolean;
  private currentCommitHash: string;
  private currentLineNumber: string;
  private lines: string[];

  constructor() {
    this.commit_data = {};
    this.line_data = {};
    this.settingCommitData = false;
    this.currentCommitHash = '';
    this.currentLineNumber = '1';
    this.lines = [];
  }

  getCommitData(): { [key: string]: CommitData } {
    return this.commit_data;
  }

  getLineData(): { [key: string]: LineData } {
    return this.line_data;
  }

  parseBlame(blame: string): boolean {
    // Split up the original document into an array of lines
    this.lines = blame.split('\n');
    if (!this.lines.length) return false;

    // Go through each line
    this.lines.forEach((line) => {
      // If we detect a tab character we know it's a line of code
      // So we can reset stateful variables
      if (line[0] === '\t') {
        // The first tab is an addition made by git, so get rid of it
        this.line_data[this.currentLineNumber].code = line.substr(1);
        this.settingCommitData = false;
        this.currentCommitHash = '';
      } else {
        const arrLine = line.split(' ');

        if (this.settingCommitData) {
          // If we are in the process of collecting data about a commit summary
          this.parseCommitLine(arrLine);
        } else if (arrLine[0].length == 40) {
          // 40 == the length of an Sha1
          // This is really only an added check, we should be guaranteed
          // that an Sha1 is expected here
          this.currentCommitHash = arrLine[0];
          this.currentLineNumber = arrLine[2];

          // Since the commit data (author, committer, summary, etc) only
          // appear once in a porcelain output for every commit, we set
          // it up once here and then expect that the next 8-11 lines of
          // the file are dedicated to that data
          if (!this.commit_data[arrLine[0]]) {
            this.settingCommitData = true;
            this.commit_data[arrLine[0]] = {
              author: '',
              authorMail: '',
              authorTime: '',
              authorTz: '',
              committer: '',
              committerMail: '',
              committerTime: '',
              committerTz: '',
              summary: '',
              previousHash: '',
              filename: '',
            };
          }

          // Setup the new line_data hash
          this.line_data[arrLine[2]] = {
            code: '',
            hash: this.currentCommitHash,
            originalLine: arrLine[1],
            finalLine: arrLine[2],
            numLines: arrLine[3] || '-1',
          };
        }
      }
    });

    return true;
  }

  /**
   * Parses and sets data from a line following a commit header
   *
   * @param {array} lineArr The current line split by a space
   */
  private parseCommitLine(lineArr: string[]): void {
    const currentCommitData = this.commit_data[this.currentCommitHash];
    switch (lineArr[0]) {
      case 'author':
        currentCommitData.author = lineArr.slice(1).join(' ');
        break;
      case 'author-mail':
        currentCommitData.authorMail = lineArr[1];
        break;
      case 'author-time':
        currentCommitData.authorTime = lineArr[1];
        break;
      case 'author-tz':
        currentCommitData.authorTz = lineArr[1];
        break;
      case 'committer':
        currentCommitData.committer = lineArr.slice(1).join(' ');
        break;
      case 'committer-mail':
        currentCommitData.committerMail = lineArr[1];
        break;
      case 'committer-time':
        currentCommitData.committerTime = lineArr[1];
        break;
      case 'committer-tz':
        currentCommitData.committerTz = lineArr[1];
        break;
      case 'summary':
        currentCommitData.summary = lineArr.slice(1).join(' ');
        break;
      case 'filename':
        currentCommitData.filename = lineArr[1];
        break;
      case 'previous':
        currentCommitData.previousHash = lineArr.slice(1).join(' ');
        break;
    }
  }
}

export default BlameJS;
